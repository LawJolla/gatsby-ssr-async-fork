import React, { createElement } from "react"
import {
  Router,
  Route,
  matchPath,
  withRouter,
} from "react-router-dom"
import { ScrollContext } from "react-router-scroll"
import createHistory from "history/createBrowserHistory"
import { apiRunner } from "./api-runner-browser"
import syncRequires from "./sync-requires"
import pages from "./pages.json"
import ComponentRenderer from "./component-renderer"
import loader from "./loader"
loader.addPagesArray(pages)
loader.addDevRequires(syncRequires)
window.___loader = loader

const history = createHistory()

// Call onRouteUpdate on the initial page load.
apiRunner(`onRouteUpdate`, {
  location: history.location,
  action: history.action,
})

function attachToHistory(history) {
  if (!window.___history) {
    window.___history = history

    history.listen((location, action) => {
      apiRunner(`onRouteUpdate`, { location, action })
    })
  }
}

function shouldUpdateScroll(prevRouterProps, { location: { pathname } }) {
  const results = apiRunner(`shouldUpdateScroll`, {
    prevRouterProps,
    pathname,
  })
  if (results.length > 0) {
    return results[0]
  }

  if (prevRouterProps) {
    const { location: { pathname: oldPathname } } = prevRouterProps
    if (oldPathname === pathname) {
      return false
    }
  }
  return true
}

let noMatch
for (let i = 0; i < pages.length; i++) {
  if (pages[i].path === `/dev-404-page/`) {
    noMatch = pages[i]
    break
  }
}

const addNotFoundRoute = () => {
  if (noMatch) {
    return createElement(Route, {
      key: `404-page`,
      component: props =>
        createElement(syncRequires.components[noMatch.componentChunkName], {
          ...props,
          ...syncRequires.json[noMatch.jsonName],
        }),
    })
  } else {
    return null
  }
}

const navigateTo = pathname => {
  window.___history.push(pathname)
}

window.___navigateTo = navigateTo

const AltRouter = apiRunner(`replaceRouterComponent`, { history })[0]
const DefaultRouter = ({ children }) =>
  <Router history={history}>
    {children}
  </Router>

// Always have to have one top-level layout
// can have ones below that. Find page, if has different
// parent layout(s), loop through those until finally the
// page. Tricky part is avoiding re-mounting I think...

const Root = () =>
  createElement(
    AltRouter ? AltRouter : DefaultRouter,
    null,
    createElement(
      ScrollContext,
      { shouldUpdateScroll },
      createElement(withRouter(ComponentRenderer), {
        layout: true,
        children: layoutProps =>
          createElement(Route, {
            render: routeProps => {
              const props = layoutProps ? layoutProps : routeProps
              attachToHistory(props.history)
              const pageResources = loader.getResourcesForPathname(
                props.location.pathname
              )
              if (pageResources) {
                return createElement(ComponentRenderer, {
                  page: true,
                  ...props,
                  pageResources,
                })
              } else {
                return addNotFoundRoute()
              }
            },
          }),
      })
    )
  )

// Let site, plugins wrap the site e.g. for Redux.
const WrappedRoot = apiRunner(`wrapRootComponent`, { Root }, Root)[0]

export default WrappedRoot
