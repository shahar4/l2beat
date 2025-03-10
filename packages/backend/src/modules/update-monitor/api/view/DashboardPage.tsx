import React, { ReactNode } from 'react'

import { Page } from '../../../status/Page'
import { reactToHtml } from '../../../status/reactToHtml'
import { DashboardProject } from '../props/getDashboardProjects'
import { getHardcoded } from '../props/utils/getHardcoded'
import { DASHBOARD_COLORS } from './constants'

interface DashboardPageProps {
  projects: Record<string, DashboardProject[]>
}

export function DashboardPage(props: DashboardPageProps) {
  const hardcoded = getHardcoded()

  const ethereumProjects = props.projects.ethereum
  const configuredEthereumProjects = ethereumProjects.filter(
    (p) => p.configured,
  )
  return (
    <Page title="Discovery">
      <meter
        id="configs-created"
        min={0}
        max={ethereumProjects.length}
        low={ethereumProjects.length}
        high={ethereumProjects.length}
        optimum={ethereumProjects.length}
        value={configuredEthereumProjects.length}
      />
      <label style={{ marginLeft: '8px' }} htmlFor="configs-created">
        {configuredEthereumProjects.length}/{ethereumProjects.length} configs
        created
      </label>
      <table>
        <thead>
          <tr>
            <TableHead rowSpan={2}>🤖</TableHead>
            <TableHead rowSpan={2}>Project</TableHead>
            <TableHead rowSpan={2}>Hardcoded</TableHead>
            <TableHead colSpan={4} style={{ textAlign: 'center' }}>
              Contracts
            </TableHead>
            <TableHead rowSpan={2} />
            <TableHead colSpan={4} style={{ textAlign: 'center' }}>
              Values
            </TableHead>
          </tr>
          <tr>
            <TableHead>ALL</TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.INITIAL }}>
              Initial
            </TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.DISCOVERED }}>
              Discovered
            </TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.UNVERIFIED }}>
              Unverified
            </TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.WATCHED }}>
              Watched
            </TableHead>
            <TableHead
              style={{ color: DASHBOARD_COLORS.IGNORED_IN_WATCH_MODE }}
            >
              IgnoreInWatchmode
            </TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.IGNORED }}>
              Ignored
            </TableHead>
            <TableHead style={{ color: DASHBOARD_COLORS.NOT_HANDLED }}>
              Not handled
            </TableHead>
          </tr>
        </thead>
        <tbody>
          {Object.entries(props.projects).map(([chainName, projects]) => (
            <>
              <tr
                style={{
                  padding: '0px',
                  textAlign: 'left',
                  background: '#363636',
                }}
              >
                <th
                  colSpan={12}
                  scope="colgroup"
                  style={{ padding: '0px', textAlign: 'left' }}
                >
                  {`Chain ${chainName}`}
                </th>
              </tr>
              {projects.map((project, index) => (
                <tr key={index} style={{ padding: '0px', textAlign: 'left' }}>
                  <TableData
                    value={
                      project.diff && project.diff.length > 0 ? (
                        <span
                          data-tooltip={
                            'Bot has detected changes in the following contracts:\n' +
                            project.diff
                              .filter((d) => (d.diff ?? []).length > 0)
                              .map((d) => `- ${d.name}`)
                              .join('\n')
                          }
                        >
                          <a
                            href={`/status/discovery/${chainName}/${project.name}`}
                          >
                            ⚠️
                          </a>
                        </span>
                      ) : (
                        ''
                      )
                    }
                  />
                  <TableData
                    value={
                      project.discoveredCount !== undefined ? (
                        <a
                          href={`/status/discovery/${chainName}/${project.name}`}
                        >
                          {project.name}
                        </a>
                      ) : (
                        <span key={index}>{project.name}</span>
                      )
                    }
                  />
                  <TableData
                    value={
                      hardcoded[project.name] === 0 ? (
                        <span style={{ color: DASHBOARD_COLORS.WATCHED }}>
                          0
                        </span>
                      ) : (
                        <span style={{ color: DASHBOARD_COLORS.UNVERIFIED }}>
                          {hardcoded[project.name]}
                        </span>
                      )
                    }
                  />
                  <TableData value={project.discoveredCount} />
                  <TableData
                    value={project.initialAddressesCount}
                    color={DASHBOARD_COLORS.INITIAL}
                  />
                  <TableData
                    value={
                      project.discoveredCount && project.initialAddressesCount
                        ? project.discoveredCount -
                          project.initialAddressesCount
                        : undefined
                    }
                    color={DASHBOARD_COLORS.DISCOVERED}
                  />
                  <TableData
                    value={project.unverifiedCount}
                    color={DASHBOARD_COLORS.UNVERIFIED}
                  />
                  <TableData />
                  <TableData
                    value={project.watchedCount}
                    color={DASHBOARD_COLORS.WATCHED}
                  />
                  <TableData
                    value={project.ignoredInWatchModeCount}
                    color={DASHBOARD_COLORS.IGNORED_IN_WATCH_MODE}
                  />
                  <TableData
                    value={project.ignoredCount}
                    color={DASHBOARD_COLORS.IGNORED}
                  />
                  <TableData
                    value={project.notHandledCount}
                    color={DASHBOARD_COLORS.NOT_HANDLED}
                  />
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </Page>
  )
}

function TableData(props: {
  value?: number | string | ReactNode
  color?: string
}) {
  return (
    <td
      style={{
        padding: '2px 12px',
        textAlign: 'left',
        color: props.color ?? '',
      }}
    >
      {props.value !== undefined && props.value}
    </td>
  )
}

function TableHead(props: {
  children?: ReactNode
  rowSpan?: number
  colSpan?: number
  style?: React.CSSProperties
}) {
  return (
    <th
      rowSpan={props.rowSpan}
      colSpan={props.colSpan}
      style={{ padding: '2px 12px', textAlign: 'left', ...props.style }}
    >
      {props.children}
    </th>
  )
}

export function renderDashboardPage(props: DashboardPageProps) {
  return reactToHtml(<DashboardPage {...props} />)
}
