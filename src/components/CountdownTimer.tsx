import React from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit = ({ value, label }: TimeUnitProps) => (
  <div className="flex flex-col items-center">
    <span className="text-[12rem] leading-none font-bold text-foreground tracking-tighter tabular-nums drop-shadow-2xl">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-[0.2em] mt-2">
      {label}
    </span>
  </div>
);

const Separator = React.memo(() => (
    <span className="text-[8rem] md:text-[10rem] leading-[1] font-light text-muted-foreground/30 self-start mt-4">
      :
    </span>
));

interface CountdownTimerProps {
  targetDate: string;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="text-center animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-black text-foreground drop-shadow-lg">
          HAPPENING NOW
        </h1>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap justify-center items-start gap-2 md:gap-4", "animate-in fade-in zoom-in duration-1000")}>
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
