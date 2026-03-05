import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertCircle, CalendarDays, CalendarRange, Home, Car, Hash, Type,
    Grid, Square, Moon, Zap, Palette, Sun, UserCircle, CircleDashed,
    Star, Compass, Heart, Globe, TrendingUp, Users, Check, MapPin, Briefcase,
    Sparkles, Loader2
} from 'lucide-react';
import { useState } from 'react';

function AIFeatureChat({ endpoint, payload, placeholder = "Ask Gemini...", buttonText = "Analyze", isTextarea = false }: { endpoint: string, payload: any, placeholder?: string, buttonText?: string, isTextarea?: boolean }) {
    const [input, setInput] = useState('');

    const chatMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, input: text })
            });
            if (!res.ok) throw new Error('Failed to get AI response');
            const data = await res.json();
            return data.response;
        }
    });

    return (
        <div className="mt-8 relative rounded-xl border-2 border-amber-9/30 bg-gradient-to-br from-amber-a2/30 to-amber-a4/30 overflow-hidden shadow-lg backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-3 opacity-20">
                <Sparkles className="w-12 h-12 text-amber-9" />
            </div>
            <div className="p-5 relative z-10">
                <h4 className="font-bold flex items-center gap-2 mb-3 text-amber-11">
                    <Sparkles className="w-5 h-5 fill-amber-9" />
                    Ask Your Cosmic AI
                </h4>

                {chatMutation.data ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-a2 border border-amber-a4 rounded-lg rounded-tr-none ml-6 text-sm leading-relaxed text-gray-12 shadow-sm">
                            {chatMutation.data}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setInput(''); chatMutation.reset(); }} className="w-full">Ask Another Question</Button>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); if (input) chatMutation.mutate(input); }} className="space-y-3">
                        {isTextarea ? (
                            <Textarea
                                placeholder={placeholder}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="resize-none bg-background/80 border-amber-a4 focus-visible:ring-amber-9 min-h-[80px]"
                                disabled={chatMutation.isPending}
                            />
                        ) : (
                            <Input
                                placeholder={placeholder}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="bg-background/80 border-amber-a4 focus-visible:ring-amber-9"
                                disabled={chatMutation.isPending}
                            />
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-amber-9 hover:bg-amber-10 text-white font-bold"
                            disabled={!input.trim() || chatMutation.isPending}
                        >
                            {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {chatMutation.isPending ? 'Analyzing Frequency...' : buttonText}
                        </Button>
                        {chatMutation.isError && <div className="text-red-9 text-xs mt-2 text-center">Failed to connect to Oracle. Try again.</div>}
                    </form>
                )}
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-a3 rounded w-3/4" />
            <div className="h-4 bg-gray-a3 rounded w-1/2" />
            <div className="space-y-2 mt-4">
                <div className="h-20 bg-gray-a3 rounded" />
                <div className="h-20 bg-gray-a3 rounded" />
                <div className="h-20 bg-gray-a3 rounded" />
            </div>
        </div>
    );
}

function ErrorMessage({ text }: { text: string }) {
    return (
        <div className="text-red-9 flex flex-col items-center justify-center py-12 gap-3 bg-red-a2 rounded-2xl border border-red-a4">
            <AlertCircle className="w-10 h-10 opacity-50" />
            <div className="font-bold">{text}</div>
        </div>
    );
}

// 1. Yearly Forecast
export function YearlyForecastDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/yearly-forecast', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/yearly-forecast/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-amber-9" />
                        Yearly Forecast
                    </DialogTitle>
                    <DialogDescription>Cosmic themes and cycles for your year ahead</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load yearly forecast" /> : data ? (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4 p-5 bg-amber-a2 rounded-xl border-2 border-amber-a4 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold text-amber-11 uppercase tracking-widest">{data.year} Theme</div>
                                    <Badge variant="secondary" className="bg-amber-9 text-white">{data.personalYearNumber} Personal Year</Badge>
                                </div>
                                <div className="text-2xl font-black text-gray-12">{data.title}</div>
                                <p className="text-gray-11 text-md leading-relaxed">{data.description}</p>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-9" />
                                    Key Quarterly Focus
                                </h4>
                                <div className="grid gap-3">
                                    {data.quarters.map((q: any, i: number) => (
                                        <div key={i} className="p-4 bg-gray-a2 rounded-lg border border-gray-a3">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-bold text-gray-12">{q.quarter}</div>
                                                <Badge variant="outline">{q.theme}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-11 italic">"{q.advice}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/yearly-forecast/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="What is your biggest goal or intention for this year?"
                                buttonText="Generate Strategic Roadmap"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 2. Monthly Forecast
export function MonthlyForecastDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/monthly-forecast', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/monthly-forecast/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarRange className="w-5 h-5 text-amber-9" />
                        Monthly Forecast
                    </DialogTitle>
                    <DialogDescription>Detailed monthly predictions and guidance</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load monthly forecast" /> : data ? (
                        <div className="space-y-6">
                            <div className="text-center p-6 bg-amber-a2 rounded-xl border-2 border-amber-a4 shadow-inner">
                                <div className="text-sm font-bold text-amber-11 uppercase mb-2">{data.monthName} Energy</div>
                                <div className="text-4xl font-black text-gray-12 mb-3">Personal Month {data.personalMonthNumber}</div>
                                <p className="text-gray-11 text-lg max-w-lg mx-auto">{data.summary}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-a2 rounded-lg">
                                    <h4 className="font-medium mb-2 flex items-center gap-2 text-green-11">
                                        <TrendingUp className="w-4 h-4" /> Opportunities
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-gray-11 space-y-1">
                                        {data.opportunities.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="p-4 bg-gray-a2 rounded-lg">
                                    <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-11">
                                        <AlertCircle className="w-4 h-4" /> Challenges to Watch
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-gray-11 space-y-1">
                                        {data.challenges.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/monthly-forecast/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="What is a specific obstacle you are facing right now?"
                                buttonText="Get Cosmic Strategy"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 3. Home Picker
export function HomePickerDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/home-picker', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/home-picker/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-amber-9" />
                        Home Picker
                    </DialogTitle>
                    <DialogDescription>Find environments and homes that match your vibe</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load home picker" /> : data ? (
                        <div className="space-y-6">
                            <p className="text-gray-11 leading-relaxed">{data.overview}</p>

                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-amber-9" /> Ideal Environments
                                </h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {data.environments.map((env: any, i: number) => (
                                        <div key={i} className="p-4 bg-gray-a2 border border-amber-a2 hover:border-amber-a5 transition-colors rounded-lg">
                                            <div className="font-bold text-gray-12">{env.type}</div>
                                            <div className="text-xs text-gray-11 mt-1">{env.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 bg-amber-a2 rounded-xl">
                                <h4 className="font-medium mb-3 flex items-center gap-2 text-amber-11">
                                    <Hash className="w-4 h-4" /> Optimal House Numbers
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {data.goodHouseNumbers.map((num: number) => (
                                        <Badge key={num} className="bg-amber-9 text-white font-bold px-3 py-1">#{num}</Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-11 italic">These numbers create a harmonic resonance with your Life Path.</p>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/home-picker/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="Enter a city, country, or specific address you're considering..."
                                buttonText="Evaluate Energetic Match"
                                isTextarea={false}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 4. Cars
export function CarsDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/cars', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/cars/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-amber-9" />
                        Vehicles
                    </DialogTitle>
                    <DialogDescription>Vehicles that align with your energetic signature</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load cars insights" /> : data ? (
                        <div className="space-y-6">
                            <p className="text-gray-11 leading-relaxed bg-gray-a2 p-4 rounded-lg">{data.overview}</p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {data.types.map((carType: any, i: number) => (
                                    <div key={i} className="p-4 bg-gradient-to-br from-amber-a2 to-transparent border border-amber-a4 rounded-xl">
                                        <div className="font-bold text-lg mb-1">{carType.category}</div>
                                        <div className="text-sm text-gray-11 mb-3">{carType.reason}</div>
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {carType.examples.map((ex: string, j: number) => (
                                                <Badge variant="outline" key={j} className="text-xs bg-background/50">{ex}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-amber-9" /> Best Colors for Your Car
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.colors.map((c: string, i: number) => (
                                        <Badge variant="secondary" key={i}>{c}</Badge>
                                    ))}
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/cars/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="What specific car make/model are you considering?"
                                buttonText="Analyze Car Energy"
                                isTextarea={false}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 5. Lucky Number
export function LuckyNumberDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/lucky-number', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/lucky-number/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-amber-9" />
                        Lucky Numbers
                    </DialogTitle>
                    <DialogDescription>Your personal numbers for manifestation</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load lucky numbers" /> : data ? (
                        <div className="space-y-6 text-center">
                            <div className="py-8 bg-amber-a2 rounded-2xl border-2 border-amber-a5 shadow-[inset_0_0_50px_rgba(251,191,36,0.1)]">
                                <div className="text-sm font-bold text-amber-11 uppercase mb-4 tracking-widest">Primary Manifestation Number</div>
                                <div className="text-8xl font-black text-amber-9 drop-shadow-lg">{data.primary}</div>
                            </div>

                            <div className="text-left space-y-4">
                                <h4 className="font-medium flex items-center gap-2 text-gray-12 border-b pb-2">
                                    <Grid className="w-4 h-4 text-amber-9" /> Secondary Numbers
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {data.secondary.map((num: number, i: number) => (
                                        <div key={i} className="w-14 h-14 rounded-full bg-gray-a2 border border-gray-a4 flex items-center justify-center text-xl font-bold">
                                            {num}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-gray-a2 rounded-lg mt-4">
                                    <h4 className="font-medium mb-1 text-sm text-gray-11 uppercase tracking-wider">How to use them</h4>
                                    <p className="text-sm leading-relaxed">{data.howToUse}</p>
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/lucky-number/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="Seen a recurring number or date? Enter it here..."
                                buttonText="Decode Synchronicity"
                                isTextarea={false}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 6. Letterology
export function LetterologyDialog({ open, onClose, profileData }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/letterology', profileData?.fullName],
        queryFn: async () => {
            if (!profileData?.fullName) return null;
            const res = await fetch(`/api/explore/letterology?name=${encodeURIComponent(profileData.fullName)}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!profileData?.fullName,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-amber-9" />
                        Letterology
                    </DialogTitle>
                    <DialogDescription>The hidden meaning behind the letters in your name</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load letterology" /> : data ? (
                        <div className="space-y-6">
                            <div className="flex justify-center flex-wrap gap-2 p-6 bg-gray-a2 rounded-xl">
                                {data.letters.map((l: any, i: number) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-lg bg-amber-9 text-white flex items-center justify-center text-2xl font-black shadow-lg">
                                            {l.char.toUpperCase()}
                                        </div>
                                        <div className="text-xs font-mono mt-2 text-gray-11">{l.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-amber-a2 border-amber-a4 border rounded-lg">
                                    <div className="text-sm text-amber-11 font-bold mb-1">Cornerstone (First Letter)</div>
                                    <div className="text-lg font-bold mb-2">"{data.cornerstone.char}"</div>
                                    <div className="text-sm leading-relaxed">{data.cornerstone.meaning}</div>
                                </div>
                                <div className="p-4 bg-gray-a2 border-gray-a4 border rounded-lg">
                                    <div className="text-sm text-gray-11 font-bold mb-1">Capstone (Last Letter)</div>
                                    <div className="text-lg font-bold mb-2">"{data.capstone.char}"</div>
                                    <div className="text-sm leading-relaxed">{data.capstone.meaning}</div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-a2 rounded-lg">
                                <h4 className="font-bold mb-2 border-b pb-2">Name Vibrational Summary</h4>
                                <p className="text-sm leading-relaxed text-gray-11">{data.summary}</p>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/letterology/interact"
                                payload={{ name: profileData?.fullName }}
                                placeholder="Enter another name, brand, or word to analyze..."
                                buttonText="Analyze Frequency"
                                isTextarea={false}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 7. Matrix Numbers
export function MatrixNumbersDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/matrix-numbers', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/matrix-numbers/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Grid className="w-5 h-5 text-amber-9" />
                        Matrix Numbers
                    </DialogTitle>
                    <DialogDescription>Decode your personal esoteric sequence</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load matrix numbers" /> : data ? (
                        <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-gray-900 to-black text-green-500 font-mono rounded-xl border border-green-900/50 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/matrix-code.png')] opacity-10 mix-blend-overlay"></div>
                                <div className="relative z-10">
                                    <div className="text-xs uppercase tracking-[0.2em] mb-4 text-green-600/70">Personal Code Decoded</div>
                                    <div className="text-4xl md:text-5xl font-black mb-6 tracking-widest text-shadow-glow">
                                        {data.sequence.join(' - ')}
                                    </div>
                                    <p className="text-sm text-green-400/80 leading-relaxed max-w-lg">
                                        {data.meaning}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3">Matrix Nodes</h4>
                                <div className="grid gap-3">
                                    {data.nodes.map((n: any, i: number) => (
                                        <div key={i} className="flex gap-4 p-4 bg-gray-a2 rounded-lg items-center">
                                            <div className="w-10 h-10 bg-amber-a3 rounded flex items-center justify-center font-bold font-mono text-amber-11">
                                                {n.number}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{n.title}</div>
                                                <div className="text-xs text-gray-11">{n.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/matrix-numbers/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="What is your current age or a significant age you're curious about?"
                                buttonText="Decode Age Activation"
                                isTextarea={false}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 8. Cue Cards
export function CueCardsDialog({ open, onClose }: any) {
    const [flipped, setFlipped] = useState(false);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['/api/explore/cue-cards'],
        queryFn: async () => {
            const res = await fetch(`/api/explore/cue-cards/draw`);
            if (!res.ok) throw new Error('Failed to draw card');
            return res.json();
        },
        enabled: open,
        staleTime: 0, // Fresh draw every time
    });

    const handleDrawAnother = () => {
        setFlipped(false);
        setTimeout(() => refetch(), 300);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setFlipped(false);
                onClose();
            }
        }}>
            <DialogContent className="max-w-md max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Square className="w-5 h-5 text-amber-9" />
                        Cue Cards
                    </DialogTitle>
                    <DialogDescription>Daily guidance drawn from the cosmos</DialogDescription>
                </DialogHeader>
                <div className="py-6 flex flex-col items-center">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to draw a card" /> : data ? (
                        <div className="flex flex-col items-center w-full">
                            <div
                                className={`relative w-64 h-96 transition-all duration-700 [transform-style:preserve-3d] cursor-pointer shadow-2xl rounded-2xl ${flipped ? '[transform:rotateY(180deg)]' : 'hover:-translate-y-2'}`}
                                onClick={() => setFlipped(true)}
                            >
                                {/* Back of Card */}
                                <div className="absolute inset-0 backface-hidden [backface-visibility:hidden] bg-gradient-to-br from-amber-7 to-amber-9 rounded-2xl flex items-center justify-center border-4 border-amber-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                    <div className="w-16 h-16 border-4 border-amber-3/50 rounded-full flex items-center justify-center rotate-45">
                                        <Star className="w-8 h-8 text-amber-3/50" />
                                    </div>
                                    <div className="absolute bottom-6 text-amber-2/70 text-sm font-bold tracking-widest uppercase">Click to Reveal</div>
                                </div>

                                {/* Front of Card */}
                                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gray-1 rounded-2xl border-2 border-amber-5 shadow-xl p-6 flex flex-col justify-between">
                                    <div className="text-center font-serif text-sm text-gray-10 tracking-widest">{data.suit}</div>
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="w-16 h-16 bg-amber-a2 rounded-full flex items-center justify-center">
                                            {/* Mock Icon mapping */}
                                            {data.type === 'action' ? <Zap className="text-amber-11 w-8 h-8" /> : <Compass className="text-amber-11 w-8 h-8" />}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-12 leading-tight">{data.cardName}</h3>
                                        <p className="text-sm text-gray-11 italic leading-relaxed">"{data.message}"</p>
                                    </div>
                                    <div className="text-center">
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{data.keyword}</Badge>
                                    </div>
                                </div>
                            </div>

                            {flipped && (
                                <div className="mt-8 w-full">
                                    <AIFeatureChat
                                        endpoint="/api/explore/cue-cards/interact"
                                        payload={{
                                            cardName: data.cardName,
                                            suit: data.suit,
                                            message: data.message
                                        }}
                                        placeholder="Ask a specific question about this card's guidance..."
                                        buttonText="Interpret Card for Me"
                                        isTextarea={true}
                                    />
                                    <Button onClick={handleDrawAnother} variant="outline" className="w-full mt-4">
                                        Draw Another Card
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// 9. Dream Interpreter
export function DreamInterpreterDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/dream-interpreter', lifePathNumber],
        queryFn: async () => {
            const res = await fetch(`/api/explore/dream-interpreter/${lifePathNumber || 1}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        Dream Symbolism
                    </DialogTitle>
                    <DialogDescription>Common recurring themes tuned to your vibration</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load dream interpreter" /> : data ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-xl text-indigo-950 dark:text-indigo-200 text-sm leading-relaxed">
                                {data.intro}
                            </div>

                            <div className="grid gap-4">
                                {data.commonDreams.map((d: any, i: number) => (
                                    <div key={i} className="p-4 bg-background rounded-lg border border-gray-a3 shadow-sm hover:border-indigo-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-gray-12 flex items-center gap-2">
                                                <Moon className="w-4 h-4 text-indigo-400" /> {d.symbol}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-11 space-y-2 mt-2">
                                            <div><span className="font-semibold text-gray-12">Meaning:</span> {d.meaning}</div>
                                            <div><span className="font-semibold text-gray-12">Your Shift:</span> {d.shift}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/dream-interpreter/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="Describe a dream symbol or scene you remember..."
                                buttonText="Decode Dream"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 10. Energy Insights
export function EnergyInsightsDialog({ open, onClose, lifePathNumber, energySignature }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/energy-insights', lifePathNumber, energySignature],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/energy-insights/${lifePathNumber}?energy=${energySignature}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-9" />
                        Energy Insights
                    </DialogTitle>
                    <DialogDescription>Deep dive into your core energetic makeup</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load energy insights" /> : data ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-amber-a2 rounded-xl">
                                <div>
                                    <div className="text-xs text-amber-11 uppercase font-bold tracking-widest mb-1">Aura Color</div>
                                    <div className="text-2xl font-black">{data.auraColor}</div>
                                </div>
                                <div
                                    className="w-16 h-16 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.2)] border-2 border-white/50"
                                    style={{ backgroundColor: data.hexCode || '#FFD700' }}
                                />
                            </div>

                            <div>
                                <h4 className="font-bold mb-3 border-b pb-2">Vibrational State</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-bold text-green-11 mb-1">High Frequency Expression</div>
                                        <p className="text-sm text-gray-11 bg-gray-a2 p-3 rounded">{data.highVibe}</p>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-red-11 mb-1">Low Frequency Expression</div>
                                        <p className="text-sm text-gray-11 bg-gray-a2 p-3 rounded">{data.lowVibe}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-a2 rounded-lg">
                                <h4 className="font-bold mb-2">Energetic Regimen</h4>
                                <p className="text-sm text-gray-12 leading-relaxed">{data.regimen}</p>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/energy-insights/interact"
                                payload={{ lifePath: lifePathNumber }}
                                placeholder="How are you feeling energetically right now?"
                                buttonText="Check Aura Hygiene"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 11. Colorology
export function ColorologyDialog({ open, onClose, lifePathNumber }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/colorology', lifePathNumber],
        queryFn: async () => {
            if (!lifePathNumber) return null;
            const res = await fetch(`/api/explore/colorology/${lifePathNumber}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!lifePathNumber,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-amber-9" />
                        Colorology
                    </DialogTitle>
                    <DialogDescription>Colors that boost your aura and success</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load colorology" /> : data ? (
                        <div className="space-y-6">
                            <p className="text-gray-11 text-sm bg-gray-a2 p-4 rounded-lg">{data.overview}</p>

                            <div className="grid gap-4">
                                {data.colors.map((c: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 border border-gray-a3 rounded-xl hover:shadow-md transition-shadow">
                                        <div className="w-16 h-16 shrink-0 rounded-lg" style={{ backgroundColor: c.hex }} />
                                        <div>
                                            <div className="font-bold text-lg">{c.name}</div>
                                            <Badge variant="secondary" className="mb-2 text-xs">{c.usage}</Badge>
                                            <p className="text-sm text-gray-11">{c.benefit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 12. Vedic Astrology
export function VedicAstrologyDialog({ open, onClose, birthDate }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/vedic-astrology', birthDate],
        queryFn: async () => {
            if (!birthDate) return null;
            const res = await fetch(`/api/explore/vedic-astrology/${birthDate}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!birthDate,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-amber-9" />
                        Vedic Astrology Snapshot
                    </DialogTitle>
                    <DialogDescription>Ancient Eastern astrological wisdom based on your birth date</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load vedic astrology" /> : data ? (
                        <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-tr from-amber-a2 to-red-a2 rounded-xl text-center border border-amber-a4">
                                <div className="text-sm font-bold text-gray-11 uppercase mb-1">Your Nakshatra (Vedic Star)</div>
                                <div className="text-3xl font-black text-amber-11">{data.nakshatra}</div>
                                <div className="text-xs mt-2 opacity-80 font-mono tracking-widest">{data.deity}</div>
                            </div>

                            <div>
                                <h4 className="font-bold border-b pb-2 mb-3 text-amber-11">Core Traits</h4>
                                <ul className="grid sm:grid-cols-2 gap-2">
                                    {data.traits.map((t: string, i: number) => (
                                        <li key={i} className="flex gap-2 items-start text-sm bg-gray-a2 p-2 rounded">
                                            <Star className="w-4 h-4 text-amber-9 shrink-0" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 bg-gray-a2 rounded-lg border-l-4 border-amber-9">
                                <h4 className="text-sm font-bold mb-1 uppercase text-gray-11 tracking-wider">Karmic Path</h4>
                                <p className="text-sm text-gray-12 leading-relaxed">{data.karmicPath}</p>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/vedic-astrology/interact"
                                payload={{ birthDate: birthDate }}
                                placeholder="Ask about a specific area of life (Career, Love, etc.)..."
                                buttonText="Get Vedic Insight"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 13. All About You
export function AllAboutYouDialog({ open, onClose, profileData }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/all-about-you', profileData?.odisId],
        queryFn: async () => {
            if (!profileData?.odisId) return null;
            const res = await fetch(`/api/explore/all-about-you/${profileData.odisId}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!profileData?.odisId,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-amber-9" />
                        All About You: The Master Profile
                    </DialogTitle>
                    <DialogDescription>A unified summary of your cosmic DNA</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to compile your master profile" /> : data ? (
                        <div className="space-y-8">
                            <div className="text-center p-8 bg-black text-white rounded-2xl relative overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-600/20 to-transparent"></div>
                                <div className="relative z-10">
                                    <div className="text-sm font-mono text-amber-400 mb-2">{data.fullName}</div>
                                    <div className="text-5xl font-black mb-4 tracking-tighter">Life Path {data.lifePath}</div>
                                    <Badge className="bg-amber-500 text-black hover:bg-amber-400 border-none px-4 py-1 text-sm font-bold">{data.archetype}</Badge>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-a2 border border-gray-a4 rounded-xl">
                                        <h4 className="font-bold text-gray-11 uppercase text-xs tracking-wider mb-2">Eastern Alignment</h4>
                                        <div className="text-lg font-bold">{data.chineseZodiac}</div>
                                        <div className="text-sm text-gray-11 mt-1">{data.easternDescription}</div>
                                    </div>
                                    <div className="p-4 bg-gray-a2 border border-gray-a4 rounded-xl">
                                        <h4 className="font-bold text-gray-11 uppercase text-xs tracking-wider mb-2">Primary Element</h4>
                                        <div className="text-lg font-bold">{data.element}</div>
                                    </div>
                                </div>
                                <div className="p-6 bg-amber-a2 border border-amber-a4 rounded-xl flex flex-col justify-center">
                                    <h4 className="font-bold text-amber-11 uppercase text-xs tracking-wider mb-3">Your Cosmic Directive</h4>
                                    <p className="text-gray-12 text-md leading-relaxed italic border-l-2 border-amber-9 pl-4">
                                        "{data.summaryDirective}"
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-black text-lg border-b pb-2 mb-4">Core Pillars</h3>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {data.pillars.map((p: any, i: number) => (
                                        <div key={i} className="text-center space-y-2 p-4">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-a3 flex items-center justify-center font-bold text-xl">{p.value}</div>
                                            <div className="font-bold text-sm">{p.title}</div>
                                            <div className="text-xs text-gray-11">{p.subtitle}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/all-about-you/interact"
                                payload={{
                                    lifePath: data.lifePath,
                                    archetype: data.archetype,
                                    element: data.element
                                }}
                                placeholder="Ask a question about your composite profile..."
                                buttonText="Ask Matrix Self"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

// 14. Saturn Insights
export function SaturnInsightsDialog({ open, onClose, birthDate }: any) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['/api/explore/saturn-insights', birthDate],
        queryFn: async () => {
            if (!birthDate) return null;
            const res = await fetch(`/api/explore/saturn-insights/${birthDate}`);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        enabled: open && !!birthDate,
    });

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CircleDashed className="w-5 h-5 text-amber-9" />
                        Saturn Insights
                    </DialogTitle>
                    <DialogDescription>Lessons and karmic cycles of your Saturn return</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    {isLoading ? <LoadingSkeleton /> : error ? <ErrorMessage text="Failed to load saturn insights" /> : data ? (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 p-6 bg-gray-a2 rounded-xl border-2 border-gray-a3">
                                <div className="shrink-0 flex flex-col items-center justify-center space-y-2">
                                    <div className="w-24 h-24 rounded-full border-4 border-amber-9 border-dashed flex items-center justify-center bg-background">
                                        <span className="text-4xl">♄</span>
                                    </div>
                                    <Badge variant="outline">{data.state}</Badge>
                                </div>
                                <div>
                                    <div className="text-2xl font-black mb-2 ">{data.headline}</div>
                                    <p className="text-sm text-gray-11 leading-relaxed">{data.overview}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-red-a2 border border-red-a4 rounded-lg">
                                    <h4 className="font-bold text-red-11 mb-2">The Lesson</h4>
                                    <p className="text-sm">{data.lesson}</p>
                                </div>
                                <div className="p-4 bg-green-a2 border border-green-a4 rounded-lg">
                                    <h4 className="font-bold text-green-11 mb-2">The Reward</h4>
                                    <p className="text-sm">{data.reward}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-a2 rounded-lg">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-amber-11">
                                    <MapPin className="w-4 h-4" /> Next Milestone
                                </h4>
                                <div className="flex items-center gap-4">
                                    <div className="text-xl font-bold font-mono bg-background px-4 py-2 rounded shadow-inner">{data.nextMilestoneYear}</div>
                                    <div className="text-sm flex-1">{data.nextMilestoneEvent}</div>
                                </div>
                            </div>

                            <AIFeatureChat
                                endpoint="/api/explore/saturn-insights/interact"
                                payload={{
                                    birthDate: birthDate,
                                    state: data.state
                                }}
                                placeholder="Ask a question about your current Saturn cycle..."
                                buttonText="Decode Karmic Lesson"
                                isTextarea={true}
                            />
                        </div>
                    ) : null}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
