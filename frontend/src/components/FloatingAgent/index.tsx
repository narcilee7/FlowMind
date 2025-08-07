'use client'

import React from 'react'
import { Bot, X } from 'lucide-react'
import { Button } from '../ui/button'


/**
 * 悬浮Agent
 * @returns 
 */
export default function FloatingAgent() {
    const [visible, setVisible] = React.useState(false)

    return (
        <>
            {visible && (
                <div className='fixed bottom-4 right-4 z-50 w-[300px] h-[400px] bg-popover border border-border rounded-xl shadow-xl p-4'>
                    <div className='flex justify-center items-center mb-2'>
                        <span className='text-sm font-medium'>AI助手</span>
                        <button onClick={() => setVisible(false)}>
                            <X className='w-4 h-4' />
                        </button>
                        {/* TODO: 别的UI填充，可能是Chat */}
                    </div>
                </div>
            )}
            <Button
                className='fixed bottom-4 right-4 z-40 rounded-full w-10 h-10 p-0'
                variant="secondary"
                onClick={() => setVisible(true)}
            >
                <Bot size={18}/>
            </Button>
        </>
    )
}
