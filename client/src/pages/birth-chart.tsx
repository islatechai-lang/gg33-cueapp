// client/src/pages/birth-chart.tsx
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { StarField } from '@/components/StarField';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Stars, AlertTriangle, Compass, Sun, Moon, Sparkles, UserCircle } from 'lucide-react';
import { calculateBirthChart } from '@/lib/astrology';
import { BirthChart } from '@/components/BirthChart';
import { parseUTCDate } from '@shared/dateUtils';

const ODIS_ID_KEY = 'gg33-odis-id';

// Simplified interpretive insights for premium feel
const SUN_INSIGHTS: Record<string, string> = {
  Aries: 'You possess a fiery, pioneering spirit. You approach life with courage, initiative, and an innate desire to lead and conquer obstacles.',
  Taurus: 'Grounded and steady, you value security, comfort, and beauty. You build lasting foundations through patience, persistence, and practical wisdom.',
  Gemini: 'Curious and highly communicative, you thrive on ideas, variety, and connections. Your mind is agile, always seeking new information.',
  Cancer: 'Deeply intuitive and emotional, you prioritize home, family, and security. You possess a strong protective instinct and nurturing nature.',
  Leo: 'Generous, creative, and expressive, you radiate warmth and confidence. You seek to shine, inspire others, and create with passion.',
  Virgo: 'Analytical, practical, and detail-oriented, you strive for order and service. You excel at refining systems and helping others grow.',
  Libra: 'Diplomatic and artistic, you seek balance, harmony, and connection. You value relationships, justice, and intellectual cooperation.',
  Scorpio: 'Intense, passionate, and magnetic, you dive deep into life\'s mysteries. You possess immense emotional strength and transformative power.',
  Sagittarius: 'Philosophical and adventure-seeking, you seek truth and expansion. You approach life with optimism, curiosity, and freedom.',
  Capricorn: 'Disciplined, ambitious, and structured, you climb the mountain of success step by step. You excel at planning and taking responsibility.',
  Aquarius: 'Innovative, humanitarian, and independent, you value individuality and collective progress. You are a visionary thinker.',
  Pisces: 'Intuitive, compassionate, and artistic, you are highly sensitive to energies. You navigate life with imagination, empathy, and spiritual depth.'
};

const MOON_INSIGHTS: Record<string, string> = {
  Aries: 'Instinctive and emotionally passionate. You react quickly, value emotional independence, and seek exciting challenges to feel secure.',
  Taurus: 'Emotionally steady and composed. You find comfort in material security, nature, stable routines, and sensory pleasures.',
  Gemini: 'Emotionally intellectual. You process feelings by talking or thinking about them, seeking constant intellectual stimulation.',
  Cancer: 'Deeply sensitive and emotional. Your moods are closely linked to your environment, seeking deep safety and maternal comfort.',
  Leo: 'Proud and emotionally generous. You need to feel appreciated, loved, and recognized to feel emotionally secure and fulfilled.',
  Virgo: 'Finds emotional security in order, organization, and being helpful. You show love by taking care of practical details.',
  Libra: 'Thrives on relational harmony. You feel most secure in partnerships and peaceful, aesthetically pleasing surroundings.',
  Scorpio: 'Intense and highly private emotional nature. You seek profound vulnerability and honesty, with powerful intuitive instincts.',
  Sagittarius: 'Finds emotional comfort in freedom, exploration, and learning. You possess an optimistic, resilient emotional outlook.',
  Capricorn: 'Emotionally disciplined and private. You express feelings through actions and practical support rather than words.',
  Aquarius: 'Emotionally independent and objective. You value space, intellectual connections, and deep loyalty within your circles.',
  Pisces: 'Highly empathetic and absorptive. You feel others\' feelings deeply, requiring solid boundaries and quiet reflection time.'
};

const ASC_INSIGHTS: Record<string, string> = {
  Aries: 'You present yourself as dynamic, direct, and active. People meet your energetic, assertive persona first.',
  Taurus: 'You project a calm, stable, and reliable presence. Others perceive you as steady, sensory-focused, and composed.',
  Gemini: 'You appear talkative, lively, and inquisitive. You engage the world with curiosity, wit, and analytical interest.',
  Cancer: 'You project a gentle, sensitive, and protective aura. You come across as cautious, caring, and intuitive.',
  Leo: 'You project a warm, dramatic, and magnetic presence. You naturally draw attention with your expressive, creative posture.',
  Virgo: 'You appear intelligent, neat, and highly observant. You meet new environments with analysis, modesty, and efficiency.',
  Libra: 'You project charm, elegance, and diplomacy. You emphasize harmony, grace, and cooperation in your initial interactions.',
  Scorpio: 'You project a quiet power, intensity, and reserve. Others find you enigmatic, highly perceptive, and magnetic.',
  Sagittarius: 'You project optimism, high energy, and friendliness. You appear enthusiastic, open-minded, and freedom-loving.',
  Capricorn: 'You project competence, reserve, and authority. Others perceive you as disciplined, professional, and serious.',
  Aquarius: 'You present yourself as unique, intellectual, and friendly but detached. You embrace progressive, unconventional ideas.',
  Pisces: 'You project a gentle, dreamy, and highly intuitive presence. You come across as fluid, creative, and sensitive.'
};

export default function BirthChartPage() {
  const savedOdisId = typeof window !== 'undefined' ? localStorage.getItem(ODIS_ID_KEY) : null;

  const { data: profileResponse, isLoading } = useQuery<any>({
    queryKey: ['/api/profile', savedOdisId],
    queryFn: async () => {
      if (!savedOdisId) return null;
      const response = await fetch(`/api/profile/${savedOdisId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!savedOdisId,
    staleTime: 1000 * 60 * 5,
  });

  const profileData = profileResponse?.user || (profileResponse && profileResponse.birthDate ? profileResponse : null);

  const chartData = useMemo(() => {
    if (!profileData?.birthDate) return null;
    try {
      const birthDateObj = parseUTCDate(profileData.birthDate);
      return calculateBirthChart(
        birthDateObj,
        profileData.birthTime || '12:00',
        profileData.birthLocation || ''
      );
    } catch (err) {
      console.error('Failed to calculate birth chart:', err);
      return null;
    }
  }, [profileData]);

  return (
    <>
      <StarField />
      <Navigation />

      <main className="pt-20 pb-12 px-4 min-h-screen" data-testid="page-birth-chart">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              <Stars className="w-3 h-3 mr-1 text-amber-9" />
              Astrological Blueprint
            </Badge>
            <h1 className="text-6 md:text-7 font-black mb-4 tracking-tight">
              Astrology <span className="gradient-text">Birth Chart</span>
            </h1>
            <p className="text-gray-11 text-3 max-w-2xl mx-auto">
              Your personalized natal chart represents a snapshot of the heavens at the precise moment you took your first breath.
            </p>
          </div>

          {/* No Profile Registered */}
          {!savedOdisId && (
            <Card variant="glow" className="text-center max-w-md mx-auto">
              <CardContent className="py-12 space-y-6">
                <div className="w-16 h-16 mx-auto bg-amber-9/10 rounded-full flex items-center justify-center border border-amber-9/20">
                  <Stars className="w-8 h-8 text-amber-9" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-4 font-black">Configure Your Profile</h3>
                  <p className="text-gray-11 text-2 max-w-xs mx-auto">
                    Enter your birth date, exact time, and location to compute and unlock your birth chart.
                  </p>
                </div>
                <Link href="/">
                  <Button variant="gold" size="lg" className="w-full">
                    Setup Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Profile Loaded & Chart Render */}
          {savedOdisId && !chartData && !isLoading && (
            <Card variant="frosted" className="border-red-9/20">
              <CardContent className="py-12 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-9" />
                <h3 className="text-4 font-bold">Failed to generate chart</h3>
                <p className="text-gray-11 text-2">
                  Ensure your profile has a valid birth date configured.
                </p>
                <Link href="/">
                  <Button variant="outline">Edit Profile</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {chartData && (
            <div className="space-y-8">
              {/* Warnings and Notes */}
              {(!chartData.hasBirthTime || !chartData.hasLocation) && (
                <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-amber-9/5 border border-amber-9/20 text-sm text-amber-11 leading-relaxed">
                  {!chartData.hasBirthTime && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        <strong>Birth time unavailable:</strong> A default of 12:00 PM was used. Ascendant, Midheaven, and houses are estimated. To see your precise rising sign and houses, update your profile with your exact birth time.
                      </span>
                    </div>
                  )}
                  {!chartData.hasLocation && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>
                        <strong>Location coordinates unknown:</strong> Standard calculations were used. Equal house divisions may vary depending on geographic latitude.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Big Three Placements Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Sun Sign */}
                <Card variant="frosted" className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
                  <CardContent className="py-5 text-center space-y-1">
                    <Sun className="w-6 h-6 mx-auto text-amber-9 mb-1" />
                    <div className="text-[10px] uppercase font-black tracking-widest text-gray-11">Sun Sign</div>
                    <div className="text-lg font-black text-white">{chartData.planets[0]?.sign}</div>
                    <div className="text-[11px] font-mono text-amber-9/80">
                      {chartData.planets[0]?.degree}° {chartData.planets[0]?.minute}'
                    </div>
                  </CardContent>
                </Card>

                {/* Moon Sign */}
                <Card variant="frosted" className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all" />
                  <CardContent className="py-5 text-center space-y-1">
                    <Moon className="w-6 h-6 mx-auto text-blue-400 mb-1" />
                    <div className="text-[10px] uppercase font-black tracking-widest text-gray-11">Moon Sign</div>
                    <div className="text-lg font-black text-white">{chartData.planets[1]?.sign}</div>
                    <div className="text-[11px] font-mono text-blue-400/80">
                      {chartData.planets[1]?.degree}° {chartData.planets[1]?.minute}'
                    </div>
                  </CardContent>
                </Card>

                {/* Rising Sign */}
                <Card variant="frosted" className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
                  <CardContent className="py-5 text-center space-y-1">
                    <Compass className="w-6 h-6 mx-auto text-purple-400 mb-1" />
                    <div className="text-[10px] uppercase font-black tracking-widest text-gray-11">Rising Sign (ASC)</div>
                    <div className="text-lg font-black text-white">{chartData.ascendantSign}</div>
                    <div className="text-[11px] font-mono text-purple-400/80">
                      {Math.floor(chartData.ascendant % 30)}° {Math.floor((chartData.ascendant % 1) * 60)}'
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* The SVG Chart Component Card */}
              <Card variant="frosted" className="border-gray-5/20 shadow-2xl">
                <CardContent className="py-8">
                  <BirthChart chartData={chartData} />
                </CardContent>
              </Card>

              {/* Astrological Core Insights Card */}
              <Card variant="glow">
                <CardHeader className="border-b border-gray-a3 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-9 animate-pulse" />
                    Your Primal Triad Insights
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-11">
                    A synthesis of the three most critical pillars in your astrological blueprint.
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-6 space-y-6">
                  {/* Sun Insight */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <Sun className="w-5 h-5 text-amber-9" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        Sun in {chartData.planets[0]?.sign} — Core Identity
                      </h4>
                      <p className="text-xs text-gray-11 leading-relaxed mt-1">
                        {SUN_INSIGHTS[chartData.planets[0]?.sign] || 'Your Sun sign reveals your main path, ego, energy focus, and baseline personality traits.'}
                      </p>
                    </div>
                  </div>

                  {/* Moon Insight */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <Moon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        Moon in {chartData.planets[1]?.sign} — Emotional Inner Self
                      </h4>
                      <p className="text-xs text-gray-11 leading-relaxed mt-1">
                        {MOON_INSIGHTS[chartData.planets[1]?.sign] || 'Your Moon sign determines your emotional habits, reactions, and subconscious needs for security.'}
                      </p>
                    </div>
                  </div>

                  {/* Ascendant Insight */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <Compass className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        Rising (Ascendant) in {chartData.ascendantSign} — Outer Persona
                      </h4>
                      <p className="text-xs text-gray-11 leading-relaxed mt-1">
                        {ASC_INSIGHTS[chartData.ascendantSign] || 'Your rising sign governs the mask you wear in public, the first impression you make, and how you start endeavors.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
