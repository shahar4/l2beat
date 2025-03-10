import {
  assert,
  FinalityApiResponse,
  LivenessType,
  UnixTime,
} from '@l2beat/shared-pure'
import { partition } from 'lodash'

import { Project } from '../../../model/Project'
import { IndexerStateRepository } from '../../../peripherals/database/repositories/IndexerStateRepository'
import { Clock } from '../../../tools/Clock'
import { LivenessRepository } from '../../liveness/repositories/LivenessRepository'
import { FinalityRepository } from '../repositories/FinalityRepository'
import { calcAvgsPerProject } from './calcAvgsPerProject'
import { divideAndAddLag } from './divideAndAddLag'

type FinalityResult =
  | {
      type: 'success'
      data: FinalityApiResponse
    }
  | {
      type: 'error'
      error: 'DATA_NOT_SYNCED'
    }

export class FinalityController {
  constructor(
    private readonly livenessRepository: LivenessRepository,
    private readonly finalityRepository: FinalityRepository,
    private readonly indexerStateRepository: IndexerStateRepository,
    private readonly projects: Project[],
    private readonly clock: Clock,
  ) {}

  async getFinality(): Promise<FinalityResult> {
    const requiredTimestamp = this.clock.getLastHour().add(-1, 'hours')
    const indexerState = await this.indexerStateRepository.findIndexerState(
      'liveness_indexer',
    )
    if (
      indexerState === undefined ||
      new UnixTime(indexerState.safeHeight).lt(requiredTimestamp)
    ) {
      return { type: 'error', error: 'DATA_NOT_SYNCED' }
    }

    const projects: FinalityApiResponse['projects'] = {}

    const [OPStackProjects, otherProjects] = partition(
      this.projects.filter((p) => !p.isArchived && p.finalityConfig),
      (p) => p.finalityConfig?.type === 'OPStack',
    )
    const OPStackFinality = await this.getOPStackFinality(OPStackProjects)
    Object.assign(projects, OPStackFinality)

    const projectsFinality = await this.getProjectsFinality(otherProjects)
    Object.assign(projects, projectsFinality)

    return { type: 'success', data: { projects } }
  }

  async getProjectsFinality(
    projects: Project[],
  ): Promise<FinalityApiResponse['projects']> {
    const result: FinalityApiResponse['projects'] = {}
    const targetTimestamp = UnixTime.now().toStartOf('day')

    await Promise.all(
      projects.map(async (project) => {
        assert(
          project.finalityConfig,
          'Finality config should not be undefined here',
        )
        const projectResult =
          await this.finalityRepository.findProjectFinalityOnTimestamp(
            project.projectId,
            targetTimestamp,
          )

        if (projectResult) {
          result[project.projectId.toString()] = {
            timeToInclusion: {
              averageInSeconds: projectResult.averageTimeToInclusion,
              maximumInSeconds: projectResult.maximumTimeToInclusion,
              minimumInSeconds: projectResult.minimumTimeToInclusion,
            },
          }
        }
      }),
    )
    return result
  }

  async getOPStackFinality(
    projects: Project[],
  ): Promise<FinalityApiResponse['projects']> {
    const result: FinalityApiResponse['projects'] = {}
    await Promise.all(
      projects.map(async (project) => {
        if (project.finalityConfig === undefined) {
          return
        }
        const records = await this.livenessRepository.getByProjectIdAndType(
          project.projectId,
          LivenessType('DA'),
          UnixTime.now().add(-30, 'days'),
        )

        const intervals = calcAvgsPerProject(records)
        const projectResult = divideAndAddLag(
          intervals,
          project.finalityConfig.lag,
        )
        if (projectResult) {
          result[project.projectId.toString()] = {
            timeToInclusion: projectResult,
          }
        }
      }),
    )
    return result
  }
}
