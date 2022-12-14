import React from 'react'
import logo from 'assets/images/logo.svg'
import { Link, NavLink } from 'react-router-dom'
import routes from 'routes'
import Search from 'App/Search/Search'
import { observer } from 'mobx-react-lite'
import { useCurrentUser } from 'User/currentUser'
import Notifications from 'App/Notifications/List'
import cn from 'classnames'
import style from './style.module.css'

type Props = {
  children: React.ReactNode
}

export default observer(function Layout({ children }: Props) {
  const [{ avatar }] = useCurrentUser()

  return (
    <div className="w-full h-full flex flex-col">
      <div
        className="bg-white shadow flex flex-shrink-0 items-center relative"
        style={{ height: '80px' }}
      >
        <div className="absolute top-0 left-0 bottom-0 ml-8 flex-center">
          <Link to={routes.home()}>
            <img style={{ width: '50px' }} src={logo} alt="logo" />
          </Link>
        </div>
        <div
          className={cn(
            'w-full mx-auto font-bold min-h-0 h-full',
            style.centerSection,
          )}
        >
          <div
            className="w-full flex items-center justify-between h-full relative"
            style={{ maxWidth: '640px' }}
          >
            <div className="flex">
              <NavLink
                to={routes.home()}
                className="text-xl"
                exact
                activeClassName="text-blue-primary"
              >
                Home
              </NavLink>
              <NavLink
                to={routes.classes()}
                className="text-xl ml-4"
                activeClassName="text-blue-primary"
              >
                Class
              </NavLink>
              <Notifications />
              <NavLink
                to={routes.settings.profile()}
                className="text-xl ml-4 flex-center"
                activeClassName="text-blue-primary"
              >
                Settings
              </NavLink>
            </div>
            <div className="hidden md:flex items-center h-full">
              <Search />
              <Link to={routes.user('me')}>
                <img
                  style={{ width: '30px', height: '30px' }}
                  className="ml-4 rounded-full"
                  src={avatar}
                  alt="avatar"
                />
              </Link>
            </div>
          </div>
        </div>
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 flex-center mr-8 text-gray-6e text-17 uppercase',
            style.extraLinks,
          )}
        >
          <a href="#" className="transition duration-200 hover:text-black">
            How to use
          </a>
          <a href="#" className="ml-5 transition duration-200 hover:text-black">
            About Schoool
          </a>
        </div>
      </div>
      <div style={{ maxWidth: '1100px' }} className="w-full mx-auto flex-grow">
        {children}
      </div>
    </div>
  )
})
