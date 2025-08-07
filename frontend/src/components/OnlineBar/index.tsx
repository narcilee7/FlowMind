export interface OnlineBarProps {
    isOnline: boolean
}

const OnlineBar: React.FC<OnlineBarProps> = ({ isOnline }) => {
    return (
        <div
            className="fixed bottom-4 right-4 bg-background backdrop-blur-sm text-muted-foreground p-2 rounded-md shadow-md border border-border text-sm font-medium"
        >
            <div
                className="flex items-center gap-2"
            >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse duration-200 mr-2"></div>
                <span>{isOnline ? '在线' : '离线，某些功能不可用'}</span>
            </div>
        </div>
    )
}

export default OnlineBar