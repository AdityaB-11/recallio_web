'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  
  // Add scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Expenses', href: '/expenses' },
    { name: 'Calories', href: '/calories' },
  ];

  return (
    <Disclosure 
      as="nav" 
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-800/90 backdrop-blur-lg shadow-lg' 
          : 'bg-slate-800/70 backdrop-blur-sm'
      }`}
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link 
                  href="/" 
                  className="flex flex-shrink-0 items-center"
                >
                  <span className="text-xl font-bold text-gradient transition-all">Recallio</span>
                </Link>
                <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative ${
                        pathname === item.href
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      } transition-colors duration-200 ease-in-out`}
                    >
                      {item.name}
                      {pathname === item.href && (
                        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all hover:ring-2">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-md overflow-hidden transition-transform hover:scale-105">
                          <span className="text-white font-medium">
                            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-slate-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-700">
                        <div className="px-4 py-2 border-b border-slate-700">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm text-gray-200 truncate">{user.email}</p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => logout()}
                              className={`${
                                active ? 'bg-slate-700' : ''
                              } block w-full px-4 py-2 text-left text-sm text-gray-200 transition-colors`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="space-x-2">
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-2 text-sm font-medium text-indigo-300 transition-all hover:text-white"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-md btn-primary px-3 py-2 text-sm font-medium text-white shadow-md"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-slate-700 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden animate-fadeIn">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`block py-2 pl-3 pr-4 text-base font-medium ${
                    pathname === item.href
                      ? 'text-indigo-300 bg-slate-700/50 border-l-2 border-indigo-500'
                      : 'text-gray-300 hover:bg-slate-700/30 hover:text-gray-200 border-l-2 border-transparent'
                  } transition-all`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-slate-700 pb-3 pt-4">
              {user ? (
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">
                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.displayName || 'User'}
                    </div>
                    {user.email && (
                      <div className="text-sm font-medium text-gray-400 truncate max-w-[200px]">{user.email}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button
                    as={Link}
                    href="/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-slate-700 hover:text-gray-200 transition-colors"
                  >
                    Log in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/signup"
                    className="block rounded-md px-3 py-2 text-base font-medium text-indigo-300 hover:bg-slate-700 transition-colors"
                  >
                    Sign up
                  </Disclosure.Button>
                </div>
              )}
              {user && (
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button
                    as="button"
                    onClick={() => logout()}
                    className="block w-full rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-slate-700 hover:text-gray-200 text-left transition-colors"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
} 