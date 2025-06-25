"use client";

import { useMemo, useEffect } from "react";
import type { AvailabilityData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Users, ArrowLeft } from "lucide-react";
import { format, startOfDay } from "date-fns";

const TIME_ORDER = [
  "Any Time",
  "Morning (9am-12pm)",
  "Afternoon (12pm-5pm)",
  "Evening (5pm-9pm)",
  "Late Night (9pm+)",
];

type AvailabilityMatrixProps = {
  data: AvailabilityData;
  onBestDateCalculated: (date: Date | null, time: string | null) => void;
  onReset: () => void;
  onGoBack: () => void;
  onSaveCalendar: () => void;
};

export function AvailabilityMatrix({
  data,
  onBestDateCalculated,
  onReset,
  onGoBack,
  onSaveCalendar,
}: AvailabilityMatrixProps) {
  const { uniqueDates, availabilityMap, bestDateInfo, bestOptions, rankedOptions } =
    useMemo(() => {
      const allDates = data.flatMap((p) => p.availabilities.map((a) => a.date));
      const uniqueDateTimes = [
        ...new Set(allDates.map((d) => startOfDay(d).getTime())),
      ];
      const uniqueDates = uniqueDateTimes
        .map((t) => new Date(t))
        .sort((a, b) => a.getTime() - b.getTime());

      const availabilityMap = new Map<string, Map<number, Set<string>>>();
      const attendanceMap = new Map<number, Map<string, number>>();

      for (const participant of data) {
        const dateMap = new Map<number, Set<string>>();
        for (const availability of participant.availabilities) {
          const dayKey = startOfDay(availability.date).getTime();
          const set = dateMap.get(dayKey) ?? new Set<string>();
          for (const time of availability.times) {
            set.add(time);
            let timeMap = attendanceMap.get(dayKey);
            if (!timeMap) {
              timeMap = new Map<string, number>();
              attendanceMap.set(dayKey, timeMap);
            }
            if (time === "Any Time") {
              for (const slot of TIME_ORDER) {
                timeMap.set(slot, (timeMap.get(slot) || 0) + 1);
              }
            } else {
              timeMap.set(time, (timeMap.get(time) || 0) + 1);
            }
          }
          dateMap.set(dayKey, set);
        }
        availabilityMap.set(participant.name, dateMap);
      }

      let bestDate: Date | null = null;
      let bestTime: string | null = null;
      let maxAttendance = 0;
      const rankedOptions: { date: Date; time: string; attendance: number }[] =
        [];

      for (const [day, timeMap] of attendanceMap) {
        for (const [time, count] of timeMap) {
          rankedOptions.push({ date: new Date(day), time, attendance: count });
          const isBetter =
            count > maxAttendance ||
            (count === maxAttendance &&
              (bestDate === null ||
                day < bestDate.getTime() ||
                (day === bestDate.getTime() &&
                  TIME_ORDER.indexOf(time) <
                    TIME_ORDER.indexOf(bestTime ?? ""))));
          if (isBetter) {
            maxAttendance = count;
            bestDate = new Date(day);
            bestTime = time;
          }
        }
      }

      rankedOptions.sort((a, b) => {
        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
        if (a.date.getTime() !== b.date.getTime())
          return a.date.getTime() - b.date.getTime();
        return TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time);
      });

      const bestOptions = rankedOptions.filter(
        (opt) => opt.attendance === maxAttendance,
      );

      return {
        uniqueDates,
        availabilityMap,
        bestDateInfo: {
          date: bestDate,
          time: bestTime,
          attendance: maxAttendance,
        },
        bestOptions,
        rankedOptions,
      };
    }, [data]);

  useEffect(() => {
    onBestDateCalculated(bestDateInfo.date, bestDateInfo.time);
  }, [bestDateInfo.date, bestDateInfo.time, onBestDateCalculated]);

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          2. Availability Results
        </CardTitle>
        <CardDescription>
          Here's who is available and when. The best date is highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bestDateInfo.date ? (
          <div className="mb-6 rounded-lg border border-primary bg-primary/10 p-4 text-center">
            <h3 className="font-headline font-semibold text-lg text-primary">
              {bestOptions.length > 1 ? 'Best Times Found!' : 'Best Time Found!'}
            </h3>
            {bestOptions.length > 1 ? (
              <div className="text-muted-foreground">
                <p>We've found multiple times that work equally well:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  {bestOptions.map(opt => (
                    <li key={`${opt.date.toISOString()}-${opt.time}`}>
                      {format(opt.date, 'EEEE, MMMM do')} at {opt.time} – {opt.attendance} / {data.length}
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="text-muted-foreground">
                The best time for your get-together is{' '}
                <span className="font-bold text-foreground">
                  {format(bestDateInfo.date, 'EEEE, MMMM do')}
                </span>{' '}
                at{' '}
                <span className="font-bold text-foreground">{bestDateInfo.time}</span>, with{' '}
                <span className="font-bold text-foreground">
                  {bestDateInfo.attendance} out of {data.length} people
                </span>{' '}
                available.
              </p>
            )}
            <Button className="mt-2" variant="outline" onClick={onSaveCalendar}>
              Save to Calendar
            </Button>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
            <h3 className="font-semibold text-lg text-destructive font-headline">
              No Common Dates
            </h3>
            <p className="text-muted-foreground">
              Unfortunately, no single date works for everyone. You might need
              to add more dates.
            </p>
          </div>
        )}
        {bestDateInfo.date && rankedOptions.length > bestOptions.length && (
          <div className="mb-6 rounded-lg border bg-muted/20 p-4">
            <h4 className="font-headline font-semibold text-lg">
              Next Best Options
            </h4>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-muted-foreground">
              {rankedOptions.slice(bestOptions.length, bestOptions.length + 3).map((opt) => (
                <li key={`${opt.date.toISOString()}-${opt.time}`}>
                  {format(opt.date, "EEEE, MMMM do")} at {opt.time} –{" "}
                  {opt.attendance} / {data.length}
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 font-bold">
                  <Users className="inline h-4 w-4 mr-2" />
                  Participants
                </TableHead>
                {uniqueDates.map((date) => {
                  const isBestDate =
                    bestDateInfo.date?.getTime() === date.getTime();
                  return (
                    <TableHead
                      key={date.toISOString()}
                      className={cn(
                        "text-center",
                        isBestDate && "bg-primary/20",
                      )}
                    >
                      <div>{format(date, "EEE")}</div>
                      <div className="font-normal text-sm">
                        {format(date, "MMM d")}
                      </div>
                      {isBestDate && (
                        <Badge
                          variant="default"
                          className="mt-1 bg-accent text-accent-foreground"
                        >
                          Best {bestDateInfo.time?.replace(/\s\(.*\)/, "")}
                        </Badge>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((participant) => (
                <TableRow key={participant.name}>
                  <TableCell className="sticky left-0 bg-card z-10 font-semibold">
                    <div className="flex flex-col">
                      <span>{participant.name}</span>
                      {participant.notes && (
                        <span className="text-xs text-muted-foreground">
                          {participant.notes}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {uniqueDates.map((date) => {
                    const key = startOfDay(date).getTime();
                    const availableTimes = availabilityMap
                      .get(participant.name)
                      ?.get(key);
                    const isBestDate =
                      bestDateInfo.date?.getTime() === date.getTime();
                    const isBestDateTime =
                      isBestDate &&
                      availableTimes &&
                      (availableTimes.has("Any Time") ||
                        (bestDateInfo.time
                          ? availableTimes.has(bestDateInfo.time)
                          : false));
                    return (
                      <TableCell
                        key={date.toISOString()}
                        className={cn(
                          "text-center align-top pt-3",
                          isBestDate && "bg-primary/10",
                          isBestDateTime && "ring-2 ring-primary",
                        )}
                      >
                        {availableTimes ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {availableTimes.has("Any Time")
                                ? "Any"
                                : Array.from(availableTimes)
                                    .map((t) => t.replace(/\s\(.*\)/, ""))
                                    .join(", ")}
                            </span>
                          </div>
                        ) : (
                          <XCircle className="mx-auto h-6 w-6 text-red-500 opacity-60" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="outline" onClick={onReset}>
          Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}
