import styled from "styled-components"

export interface OnlineBarProps {
    isOnline: boolean
}

const OnlineBarContainer = styled.div`
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: var(--background);
    backdrop-filter: blur(4px);
    color: var(--muted-foreground);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border);
    font-size: 0.875rem;
    font-weight: 500;
`

const OnlineBarContent = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`

const OnlineBarDot = styled.div`
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--primary);
    margin-right: 0.5rem;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`

const OnlineBar: React.FC<OnlineBarProps> = ({ isOnline }) => {
    return (
        <OnlineBarContainer>
            <OnlineBarContent>
                <OnlineBarDot />
                <span>{isOnline ? '在线' : '离线，某些功能不可用'}</span>
            </OnlineBarContent>
        </OnlineBarContainer>
    )
}

export default OnlineBar