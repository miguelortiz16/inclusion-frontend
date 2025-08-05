declare module 'react-wheel-of-prizes' {
  interface WheelOfPrizesProps {
    options: string[];
    onClick: () => void;
    spinning: boolean;
    width?: number;
    height?: number;
    duration?: number;
    onFinished?: (prize: string) => void;
  }

  const WheelOfPrizes: React.FC<WheelOfPrizesProps>;
  export default WheelOfPrizes;
} 