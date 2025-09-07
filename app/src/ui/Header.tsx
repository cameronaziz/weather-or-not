import clsx from 'clsx';
import type { FC } from "react";
import { useContext } from 'react';
import Convo from '../context/convo';

const Flair: FC = () => {
  return (
    <>
      <div className="hidden sm:block md:block absolute top-0 end-0 -translate-y-8 sm:-translate-y-10 md:-translate-y-12 translate-x-6 sm:translate-x-8 md:translate-x-10">
        <svg className="w-10 sm:w-12 md:w-16 h-auto text-orange-500" width="121" height="135" viewBox="0 0 121 135" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 16.4754C11.7688 27.4499 21.2452 57.3224 5 89.0164" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M33.6761 112.104C44.6984 98.1239 74.2618 57.6776 83.4821 5" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M50.5525 130C68.2064 127.495 110.731 117.541 116 78.0874" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>
      <div className="hidden lg:block absolute bottom-0 start-0 translate-y-6 sm:translate-y-8 md:translate-y-10 -translate-x-20 sm:-translate-x-24 md:-translate-x-32">
        <svg className="w-24 sm:w-32 md:w-40 h-auto text-cyan-500" width="347" height="188" viewBox="0 0 347 188" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 82.4591C54.7956 92.8751 30.9771 162.782 68.2065 181.385C112.642 203.59 127.943 78.57 122.161 25.5053C120.504 2.2376 93.4028 -8.11128 89.7468 25.5053C85.8633 61.2125 130.186 199.678 180.982 146.248L214.898 107.02C224.322 95.4118 242.9 79.2851 258.6 107.02C274.299 134.754 299.315 125.589 309.861 117.539L343 93.4426"
            stroke="currentColor"
            strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>
    </>
  )
}

const Title: FC = () => {
  const { isConvoMode } = useContext(Convo.Context)
  const subTitle = isConvoMode ? 'Oh, you wanna be cryptic? Two can play this game! 🕵️‍♂️' : 'Natural language processor for attire recomentations.'

  return (
    <div className='text-center px-4'>
      <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-neutral-200 leading-tight">
        Weather <span className={clsx('transition-colors duration-200 ease-in-out', {
          'text-orange-300': isConvoMode
        })}>{isConvoMode ? 'coy' : 'or'}</span> Not
      </h1>
      <p className={clsx('mt-1.5 sm:mt-2 md:mt-3 text-xs xs:text-sm sm:text-base md:text-lg transition-colors duration-200 ease-in-out px-2 sm:px-0', {
        'text-gray-600 dark:text-neutral-400': !isConvoMode,
        'text-gray-300 dark:text-neutral-800': isConvoMode
      })}>
        {subTitle}
      </p>
    </div>
  )
}

const Header: FC = () => {
  const { messages } = useContext(Convo.Context)

  const hasMessages = messages.length > 0

  return (
    <div className={clsx('fixed left-0 right-0 z-10 px-3 sm:px-6 md:px-8 lg:px-[15vw] xl:px-[20vw] py-3 sm:py-4 md:py-6 transition-all duration-500 ease-in-out pt-safe', {
      'top-[10vh] xs:top-[15vh] sm:top-[20vh] md:top-[25vh] lg:top-[30vh]': !hasMessages,
      'top-4 sm:top-6 md:top-8': hasMessages
    })}>
      <div className="relative">
        <Title />
        <Flair />
      </div>
    </div>
  )
}

export default Header