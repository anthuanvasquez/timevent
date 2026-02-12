import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit = ({ value, label }: TimeUnitProps) => (
  <div className="flex flex-col items-center">
    <span className="text-[12rem] leading-none font-bold text-white tracking-tighter tabular-nums drop-shadow-2xl">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-sm md:text-base font-medium text-white/60 uppercase tracking-[0.2em] mt-2">
      {label}
    </span>
  </div>
);

const Separator = () => (
    <div className="flex flex-col gap-8 mx-4 h-[8rem] justify-center opacity-50">
        <div className="w-3 h-3 rounded-full bg-white/40"></div>
        <div className="w-3 h-3 rounded-full bg-white/40"></div>
    </div>
);

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="text-center animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-lg">
          HAPPENING NOW
        </h1>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap justify-center items-start gap-2", "animate-in fade-in zoom-in duration-1000")}>
      {days > 0 && (
          <>
            <TimeUnit value={days} label="Days" />
            <Separator />
          </>
      )}
      <TimeUnit value={hours + (days * 24)} label="Hours" />
      <Separator />
      <TimeUnit value={minutes} label="Minutes" />
      <Separator />
      <TimeUnit value={seconds} label="Seconds" />
    </div>
  );
}
