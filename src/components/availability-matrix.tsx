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
  CardFooter
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
import { CheckCircle2, XCircle, Users, Clock } from "lucide-react";
import { format } from "date-fns";

type AvailabilityMatrixProps = {
  data: AvailabilityData;
  onBestDateCalculated: (date: Date | null) => void;
  onReset: () => void;
};

export function AvailabilityMatrix({ data, onBestDateCalculated, onReset }: AvailabilityMatrixProps) {
  const { uniqueDates, availabilityMap, bestDateInfo } = useMemo(() => {
    const allDates = data.flatMap((p) => p.dates);
    const uniqueDateStrings = [...new Set(allDates.map((d) => d.toISOString().split("T")[0]))];
    const uniqueDates = uniqueDateStrings.map((ds) => new Date(ds)).sort((a, b) => a.getTime() - b.getTime());

    const availabilityMap = new Map<string, Set<string>>();
    for (const participant of data) {
      const dateStrings = new Set(participant.dates.map((d) => d.toISOString().split("T")[0]));
      availabilityMap.set(participant.name, dateStrings);
    }
    
    let bestDate: Date | null = null;
    let maxAttendance = 0;
    
    for (const date of uniqueDates) {
        const dateString = date.toISOString().split('T')[0];
        let currentAttendance = 0;
        for (const participant of data) {
            if (availabilityMap.get(participant.name)?.has(dateString)) {
                currentAttendance++;
            }
        }
        if (currentAttendance > maxAttendance) {
            maxAttendance = currentAttendance;
            bestDate = date;
        }
    }

    return { uniqueDates, availabilityMap, bestDateInfo: { date: bestDate, attendance: maxAttendance } };
  }, [data]);

  useEffect(() => {
    onBestDateCalculated(bestDateInfo.date);
  }, [bestDateInfo.date, onBestDateCalculated]);

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">2. Availability Results</CardTitle>
        <CardDescription>
          Here's who is available and when. The best date is highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bestDateInfo.date ? (
          <div className="mb-6 rounded-lg border border-primary bg-primary/10 p-4 text-center">
             <h3 className="font-headline font-semibold text-lg text-primary-foreground/90">Best Date Found!</h3>
            <p className="text-muted-foreground">
              The best day for your get-together is{" "}
              <span className="font-bold text-foreground">{format(bestDateInfo.date, "EEEE, MMMM do")}</span>
              , with{" "}
              <span className="font-bold text-foreground">{bestDateInfo.attendance} out of {data.length} people</span> available.
              Check below for preferred times.
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
            <h3 className="font-semibold text-lg text-destructive font-headline">No Common Dates</h3>
            <p className="text-muted-foreground">Unfortunately, no single date works for everyone. You might need to add more dates.</p>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 font-bold"><Users className="inline h-4 w-4 mr-2" />Participants</TableHead>
                <TableHead className="w-[150px]"><Clock className="inline h-4 w-4 mr-2" />Time</TableHead>
                {uniqueDates.map((date) => {
                   const isBestDate = bestDateInfo.date?.getTime() === date.getTime();
                  return (
                    <TableHead key={date.toISOString()} className={cn("text-center", isBestDate && "bg-primary/20")}>
                      <div>{format(date, "EEE")}</div>
                      <div className="font-normal text-sm">{format(date, "MMM d")}</div>
                      {isBestDate && <Badge variant="default" className="mt-1 bg-accent text-accent-foreground">Best</Badge>}
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((participant) => (
                <TableRow key={participant.name}>
                  <TableCell className="sticky left-0 bg-card z-10 font-semibold">{participant.name}</TableCell>
                  <TableCell>{participant.time || 'Any'}</TableCell>
                  {uniqueDates.map((date) => {
                    const dateString = date.toISOString().split("T")[0];
                    const isAvailable = availabilityMap.get(participant.name)?.has(dateString);
                    const isBestDate = bestDateInfo.date?.getTime() === date.getTime();
                    return (
                      <TableCell key={date.toISOString()} className={cn("text-center", isBestDate && "bg-primary/10")}>
                        {isAvailable ? (
                          <CheckCircle2 className="mx-auto h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="mx-auto h-6 w-6 text-destructive opacity-60" />
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
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onReset}>Start Over</Button>
      </CardFooter>
    </Card>
  );
}
