import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit = ({ value, label }: TimeUnitProps) => (
  <div className="flex flex-col items-center mx-4 md:mx-8">
    <span className="text-6xl md:text-9xl font-black text-foreground tracking-tighter tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-sm md:text-xl text-muted-foreground uppercase tracking-widest mt-2 md:mt-4">
      {label}
    </span>
  </div>
);

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-black text-foreground animate-pulse">
          IT'S TIME
        </h1>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap justify-center items-center", "animate-in fade-in zoom-in duration-1000")}>
      {days > 0 && <TimeUnit value={days} label="Days" />}
      <TimeUnit value={hours} label="Hours" />
      <TimeUnit value={minutes} label="Minutes" />
      <TimeUnit value={seconds} label="Seconds" />
    </div>
  );
}
