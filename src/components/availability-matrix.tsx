"use client";

import { useMemo, useEffect, useState } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  XCircle,
} from "lucide-react";
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
  onSaveCalendar: (date: Date, time: string) => void;
};

export function AvailabilityMatrix({
  data,
  onBestDateCalculated,
  onReset,
  onGoBack,
  onSaveCalendar,
}: AvailabilityMatrixProps) {
  const { uniqueDates, availabilityMap, bestOptions, rankedOptions } =
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
        opt => opt.attendance === maxAttendance,
      );

      return {
        uniqueDates,
        availabilityMap,
        bestOptions,
        rankedOptions,
      };
    }, [data]);

  const [selectedBestIndex, setSelectedBestIndex] = useState(0);

  const nextBestOptions = useMemo(() => {
    if (rankedOptions.length === 0 || bestOptions.length === 0) return [];
    const byDate = new Map<number, { date: Date; time: string; attendance: number }[]>();
    for (const opt of rankedOptions) {
      if (opt.attendance >= bestOptions[0].attendance) continue;
      const dayKey = startOfDay(opt.date).getTime();
      const arr = byDate.get(dayKey) ?? [];
      arr.push(opt);
      byDate.set(dayKey, arr);
    }

    const results: { date: Date; time: string; attendance: number }[] = [];
    for (const opts of byDate.values()) {
      const any = opts.find(o => o.time === "Any Time");
      results.push(any ?? opts[0]);
    }

    results.sort((a, b) => {
      if (b.attendance !== a.attendance) return b.attendance - a.attendance;
      if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
      return TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time);
    });

    return results.slice(0, 3);
  }, [rankedOptions, bestOptions]);

  useEffect(() => {
    const opt = bestOptions[selectedBestIndex];
    onBestDateCalculated(opt?.date ?? null, opt?.time ?? null);
  }, [bestOptions, selectedBestIndex, onBestDateCalculated]);

  const selectedBest = bestOptions[selectedBestIndex];

  useEffect(() => {
    onBestDateCalculated(selectedBest?.date ?? null, selectedBest?.time ?? null);
  }, [selectedBest, onBestDateCalculated]);

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
        {selectedBest ? (
          <div className="mb-6 rounded-xl border-2 border-primary bg-primary/5 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-headline text-xl font-bold text-primary-foreground bg-primary rounded-full px-4 py-1 inline-block mb-2">
                    {bestOptions.length > 1
                      ? `Top ${bestOptions.length} Options`
                      : "Best Option"}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {format(selectedBest.date, "EEEE, MMMM do")}
                  </p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {selectedBest.time}
                  </p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-background p-3">
                   <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary"/>
                    <span className="text-3xl font-bold text-primary">{selectedBest.attendance}</span>
                    <span className="text-lg text-muted-foreground">/ {data.length}</span>
                   </div>
                   <p className="text-sm font-medium text-muted-foreground">Attendees</p>
                </div>
              </div>

              {bestOptions.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setSelectedBestIndex((idx) => Math.max(idx - 1, 0))
                    }
                    disabled={selectedBestIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium text-center w-48">
                    Option {selectedBestIndex + 1} of {bestOptions.length}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setSelectedBestIndex((idx) =>
                        Math.min(idx + 1, bestOptions.length - 1)
                      )
                    }
                    disabled={selectedBestIndex === bestOptions.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <Button
                size="lg"
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onSaveCalendar(selectedBest.date, selectedBest.time)}
              >
                <CalendarPlus className="mr-2 h-5 w-5" />
                Confirm & Add to Calendar
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
        {selectedBest && rankedOptions.length > bestOptions.length && (
          <Accordion type="single" collapsible className="w-full mb-6">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-base font-semibold">
                  Show Next Best Options
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="mt-2 list-decimal list-inside space-y-2 text-muted-foreground pl-4">
                    {nextBestOptions.map((opt) => (
                      <li key={`${opt.date.toISOString()}-${opt.time}`}>
                        <span className="font-semibold text-foreground">{format(opt.date, "EEE, MMM d")}</span> at {opt.time} –{" "}
                        <span className="font-semibold text-foreground">{opt.attendance} / {data.length}</span> attendees
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                    selectedBest?.date?.getTime() === date.getTime();
                  return (
                    <TableHead
                      key={date.toISOString()}
                      className={cn(
                        "text-center min-w-[120px] px-3 py-2 sm:py-3",
                        isBestDate && "bg-primary/10",
                      )}
                    >
                      <div className="font-semibold">{format(date, "EEE")}</div>
                      <div className="font-normal text-sm text-muted-foreground">
                        {format(date, "MMM d")}
                      </div>
                      {isBestDate && (
                        <Badge
                          variant="default"
                          className="mt-1 bg-primary text-primary-foreground pointer-events-none"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Best
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
                      selectedBest?.date?.getTime() === date.getTime();
                    const isBestDateTime =
                      isBestDate &&
                      availableTimes &&
                      (availableTimes.has("Any Time") ||
                        (selectedBest?.time
                          ? availableTimes.has(selectedBest.time)
                          : false));
                    return (
                      <TableCell
                        key={date.toISOString()}
                        className={cn(
                          "text-center align-top px-3 py-2 sm:py-3",
                          isBestDate && "bg-primary/5",
                          isBestDateTime && "outline outline-2 outline-offset-[-2px] outline-primary",
                        )}
                      >
                        {availableTimes ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div className="flex flex-wrap items-center justify-center gap-1">
                            {Array.from(availableTimes)
                                .sort((a, b) => TIME_ORDER.indexOf(a) - TIME_ORDER.indexOf(b))
                                .map(t => (
                                  <Badge key={t} variant="secondary" className="text-xs font-medium">
                                    {t === "Any Time" ? "Any" : t.replace(/\s\(.*\)/, "")}
                                  </Badge>
                                ))
                            }
                            </div>
                          </div>
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-destructive/60" />
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
      <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-6">
        <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
          Start Over
        </Button>
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back & Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
