
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, PlusCircle, Trash2, Check, X, Pencil, ChevronDown } from "lucide-react";
import type { AvailabilityData } from "@/lib/types";

const dateAvailabilitySchema = z.object({
  date: z.date(),
  time: z.string(),
});

const participantSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  availabilities: z.array(dateAvailabilitySchema).min(1, "Please select at least one date."),
  notes: z.string().max(200, "Notes must be under 200 characters.").optional(),
  isEditing: z.boolean().optional(),
});

const formSchema = z.object({
  participants: z
    .array(participantSchema)
    .min(1, "Please add at least one participant."),
});

type DatePollingFormProps = {
  onSubmit: (data: AvailabilityData) => void;
  roomId: string;
};

export function DatePollingForm({ onSubmit, roomId }: DatePollingFormProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participants: [],
    },
  });

  const { fields, append, remove, replace, update } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        const data = await res.json();
        if (data.participants && data.participants.length > 0) {
          const participantsWithDates = data.participants.map((p: any) => ({
            ...p,
            availabilities: p.availabilities.map((a: { date: string, time: string }) => ({
              date: new Date(a.date),
              time: a.time,
            })),
            isEditing: false,
          }));
          replace(participantsWithDates);
        }
      } catch (e) {
        console.error('Failed to load participants', e);
      }
    };
    load();
  }, [replace, roomId]);

  const watchedParticipants = form.watch("participants");
  React.useEffect(() => {
    const participantsToSave = watchedParticipants
      .filter(p => !p.isEditing)
      .map(({ isEditing, ...rest }) => rest);

    if (participantsToSave.length > 0) {
      fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: participantsToSave }),
      }).catch(e => console.error('Failed to save participants', e));
    }
  }, [watchedParticipants, roomId]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const confirmedParticipants = values.participants
      .filter(p => !p.isEditing)
      .map(({ isEditing, ...rest }) => rest);
    onSubmit(confirmedParticipants);
  };
  
  const addParticipant = () => {
    const newId = crypto.randomUUID();
    append({ id: newId, name: "", availabilities: [], notes: "", isEditing: true });
    setExpanded(prev => ({...prev, [newId]: true}));
  };

  const handleConfirmParticipant = async (index: number) => {
    const isValid = await form.trigger(`participants.${index}`);
    if (isValid) {
      const participantData = form.getValues().participants[index];
      update(index, { ...participantData, isEditing: false });
      setExpanded(prev => ({...prev, [participantData.id]: false}));
    }
  }

  const handleEditParticipant = (index: number) => {
    const participantData = form.getValues().participants[index];
    update(index, { ...participantData, isEditing: true });
    setExpanded(prev => ({...prev, [participantData.id]: true}));
  };
  
  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          1. Plan Your Get-Together
        </CardTitle>
        <CardDescription>
          Add participants and specify their available dates and times.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4 min-h-[10rem]">
              {fields.length === 0 && (
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 h-full p-8 text-center">
                    <p className="text-muted-foreground font-semibold">No participants yet.</p>
                    <p className="text-muted-foreground text-sm">Click the button below to add someone to the plan.</p>
                 </div>
              )}
              {fields.map((participantField, index) => {
                const isExpanded = !!expanded[participantField.id];
                return (
                <div
                  key={participantField.id}
                  className="flex flex-col gap-4 rounded-lg border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <FormItem 
                      className="flex-grow"
                      onClick={!participantField.isEditing ? () => toggleExpand(participantField.id) : undefined}
                      style={{ cursor: !participantField.isEditing ? 'pointer' : 'default' }}
                    >
                      <FormLabel className="flex items-center gap-2">
                        Participant {index + 1}
                        {!participantField.isEditing && <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />}
                      </FormLabel>
                      <FormField
                        control={form.control}
                        name={`participants.${index}.name`}
                        render={({ field }) => (
                          <FormControl>
                            <Input placeholder="Enter name..." {...field} disabled={!participantField.isEditing} />
                          </FormControl>
                        )}
                      />
                      <FormMessage {...form.getFieldState(`participants.${index}.name`)} />
                    </FormItem>
                    <div className="flex items-center gap-1 self-start pt-6 sm:ml-auto sm:pt-2">
                      {participantField.isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={() => handleConfirmParticipant(index)}
                          >
                            <Check className="h-5 w-5" />
                            <span className="sr-only">Confirm participant</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => remove(index)}
                          >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        </>
                      ) : (
                         <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditParticipant(index)}
                          >
                            <Pencil className="h-5 w-5" />
                            <span className="sr-only">Edit participant</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Remove participant</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {(isExpanded || participantField.isEditing) && (
                    <>
                      <FormField
                        control={form.control}
                        name={`participants.${index}.availabilities`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Available Dates & Times</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal md:w-[240px]",
                                      !field.value?.length && "text-muted-foreground"
                                    )}
                                    disabled={!participantField.isEditing}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.length > 0 ? (
                                      <span>{field.value.length} date(s) selected</span>
                                    ) : (
                                      <span>Pick dates</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="multiple"
                                  selected={field.value?.map(a => a.date)}
                                  onSelect={(dates) => {
                                    const newAvailabilities = (dates || []).map(date => {
                                      const existing = field.value?.find(a => a.date.getTime() === date.getTime());
                                      return existing || { date, time: "Any Time" };
                                    });
                                    field.onChange(newAvailabilities);
                                  }}
                                  initialFocus
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-2">
                              {field.value?.slice().sort((a,b) => a.date.getTime() - b.date.getTime()).map((availability) => (
                                  <div key={availability.date.toISOString()} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                    <span className="text-sm font-medium">{format(availability.date, "PPP")}</span>
                                    <Select
                                      value={availability.time}
                                      onValueChange={(time) => {
                                          const updatedAvailabilities = field.value.map(a => a.date.getTime() === availability.date.getTime() ? { ...a, time: time } : a);
                                          field.onChange(updatedAvailabilities);
                                      }}
                                      disabled={!participantField.isEditing}
                                    >
                                      <SelectTrigger className="h-8 w-[190px] flex-shrink-0 bg-background">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Any Time">Any Time</SelectItem>
                                        <SelectItem value="Morning (9am-12pm)">Morning (9am-12pm)</SelectItem>
                                        <SelectItem value="Afternoon (12pm-5pm)">Afternoon (12pm-5pm)</SelectItem>
                                        <SelectItem value="Evening (5pm-9pm)">Evening (5pm-9pm)</SelectItem>
                                        <SelectItem value="Late Night (9pm+)">Late Night (9pm+)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`participants.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="pt-4">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., vegetarian or can't do Mondays"
                                {...field}
                                disabled={!participantField.isEditing}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )})}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addParticipant}
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
              disabled={fields.length === 0 || fields.some(p => p.isEditing)}
            >
              Find Best Date
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
