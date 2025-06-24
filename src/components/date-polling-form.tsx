"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2, Clock } from "lucide-react";
import type { AvailabilityData } from "@/lib/types";

const participantSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  dates: z.array(z.date()).min(1, "Please select at least one date."),
  time: z.string().optional(),
});

const formSchema = z.object({
  participants: z
    .array(participantSchema)
    .min(1, "Please add at least one participant."),
});

type DatePollingFormProps = {
  onSubmit: (data: AvailabilityData) => void;
};

const LOCAL_STORAGE_KEY = 'gather-ease-participants';

export function DatePollingForm({ onSubmit }: DatePollingFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participants: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.participants && parsed.participants.length > 0) {
          const participantsWithDates = parsed.participants.map((p: any) => ({
            ...p,
            dates: p.dates.map((d: string) => new Date(d)),
          }));
          replace(participantsWithDates);
        } else {
          append({ id: crypto.randomUUID(), name: "", dates: [], time: "" });
        }
      } else {
        append({ id: crypto.randomUUID(), name: "", dates: [], time: "" });
      }
    } catch (e) {
      console.error("Failed to load or parse saved data", e);
      append({ id: crypto.randomUUID(), name: "", dates: [], time: "" });
    }
  }, []);

  const watchedParticipants = form.watch("participants");
  React.useEffect(() => {
    if (watchedParticipants && watchedParticipants.length > 0) {
      const hasData = watchedParticipants.some(
        (p) => p.name || p.dates.length > 0 || p.time
      );
      if (hasData) {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ participants: watchedParticipants })
        );
      }
    }
  }, [watchedParticipants]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values.participants);
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          1. Plan Your Get-Together
        </CardTitle>
        <CardDescription>
          Add participants, their available dates, and preferred times. The data is saved automatically.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-start"
                >
                  <FormField
                    control={form.control}
                    name={`participants.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Participant {index + 1}</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`participants.${index}.time`}
                    render={({ field }) => (
                      <FormItem className="sm:w-[200px] flex-shrink-0">
                        <FormLabel>Preferred Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 6pm - 9pm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`participants.${index}.dates`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Available Dates</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal sm:w-[240px]",
                                  !field.value?.length &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.length > 0 ? (
                                  field.value.length > 1 ? (
                                    <span>
                                      {field.value.length} dates selected
                                    </span>
                                  ) : (
                                    format(field.value[0], "PPP")
                                  )
                                ) : (
                                  <span>Pick dates</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="multiple"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-auto text-muted-foreground hover:text-destructive sm:ml-2"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Remove participant</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ id: crypto.randomUUID(), name: "", dates: [], time: "" })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Participant
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Find Best Date
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
