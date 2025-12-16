import React from 'react';

export default function GridBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            {/* Gradient Overlay for fade effect - Adaptive */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-zinc-950 dark:via-transparent dark:to-zinc-950 z-10" />

            {/* Grid Container with Perspective */}
            <div className="absolute inset-0 z-0 [perspective:1000px]">
                {/* Moving Grid Plane */}
                <div className="absolute inset-0 origin-bottom transform-gpu rotate-x-[60deg]">
                    {/* The grid pattern itself - Adaptive Colors */}
                    <div className="w-[400%] h-[400%] -ml-[150%] -mt-[50%] 
                bg-[linear-gradient(to_right,rgba(8,145,178,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(8,145,178,0.2)_1px,transparent_1px)] 
                dark:bg-[linear-gradient(to_right,rgba(6,182,212,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.3)_1px,transparent_1px)] 
                bg-[size:4rem_4rem] 
                [mask-image:linear-gradient(to_bottom,transparent_5%,white_100%)] 
                animate-grid-flow"
                    />
                </div>
            </div>
        </div>
    );
}
