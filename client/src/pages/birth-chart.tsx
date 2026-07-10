// client/src/pages/birth-chart.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Navigation } from '@/components/Navigation';
import { StarField } from '@/components/StarField';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Stars, AlertTriangle, Compass, Sun, Moon, Sparkles, 
  Flame, Globe, Zap, Heart, MessageSquare, BookOpen, 
  Activity, Shield, Trophy, Layout, Landmark, HelpCircle, UserCircle
} from 'lucide-react';
import { calculateBirthChart, ELEMENT_FOR_SIGN, ELEMENT_COLORS, PLANET_GLYPHS, PLANET_COLORS } from '@/lib/astrology';
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

const HOUSE_DESCRIPTIONS: Record<number, { name: string; icon: any; meaning: string }> = {
  1: { name: '1st House (Self & Outlook)', icon: UserCircle, meaning: 'Your identity, physical appearance, first impressions, and self-expression.' },
  2: { name: '2nd House (Values & Money)', icon: Landmark, meaning: 'Personal finance, wealth generation, values, self-worth, and material security.' },
  3: { name: '3rd House (Mind & Communication)', icon: MessageSquare, meaning: 'Intellectual processes, communication, learning, writing, speaking, and local community.' },
  4: { name: '4th House (Home & Roots)', icon: Landmark, meaning: 'Home, family roots, domestic environment, emotional foundations, and private life.' },
  5: { name: '5th House (Creativity & Romance)', icon: Heart, meaning: 'Self-expression, creative output, artistic ventures, romance, children, and joy.' },
  6: { name: '6th House (Health & Service)', icon: Activity, meaning: 'Daily routines, workplace habits, physical health, self-care, and acts of service.' },
  7: { name: '7th House (Partnerships)', icon: Landmark, meaning: 'Marriage, business partnerships, agreements, and long-term commitments.' },
  8: { name: '8th House (Transformation & Shared Wealth)', icon: Shield, meaning: 'Inheritances, shared resources, intimacy, birth, rebirth, and psychological depth.' },
  9: { name: '9th House (Philosophy & Exploration)', icon: Globe, meaning: 'Long-distance travel, foreign cultures, philosophy, higher education, and spiritual exploration.' },
  10: { name: '10th House (Career & Legacy)', icon: Trophy, meaning: 'Professional status, long-term ambitions, legacy, authority, and public reputation.' },
  11: { name: '11th House (Community & Hopes)', icon: Stars, meaning: 'Friendships, networking circles, group efforts, global causes, and future dreams.' },
  12: { name: '12th House (Soul & Subconscious)', icon: HelpCircle, meaning: 'solitude, dreams, subconscious habits, karmic loops, and spiritual evolution.' }
};

const PLANET_IN_HOUSE_INTERPRETATIONS: Record<string, string> = {
  Sun: 'Focuses your core identity, pride, and life vitality in this domain. You seek to shine here.',
  Moon: 'Infuses this domain with emotional sensitivity, intuitive depth, and shifting moods.',
  Mercury: 'Directs your analytical thinking, communication skills, curiosity, and mental power here.',
  Venus: 'Brings aesthetic value, harmony, romantic attraction, and financial flow into this field.',
  Mars: 'Drives ambition, physical motivation, competitive energy, and focused action here.',
  Jupiter: 'Expands opportunities, luck, spiritual expansion, and material abundance in this sector.',
  Saturn: 'Demands absolute responsibility, discipline, hard work, and lessons through patience here.',
  Uranus: 'Triggers unconventional ideas, eccentric breakthroughs, and sudden, unexpected changes here.',
  Neptune: 'Sparks creative imagination, dreams, and spiritual sensitivity, but requires boundaries.',
  Pluto: 'Promotes deep psychological rebirth, empowerment, and ultimate life transformations here.'
};

const DOMINANT_ENERGY_TEXTS: Record<string, string> = {
  Fire: 'driven by inspiration, passion, and gut instincts. You lead with confidence and thrive in situations requiring fast action and courage.',
  Earth: 'deeply grounded, realistic, and practical. You value security, stability, and steady progress, building success step-by-step.',
  Air: 'highly intellectual, analytical, and communicative. You process the world through ideas, logic, social connections, and objective thinking.',
  Water: 'rich in emotional intelligence, intuition, and empathy. You read rooms naturally and navigate life through felt resonance and emotional depth.'
};

const ASPECT_EXPLANATIONS: Record<string, { desc: string; type: string }> = {
  conjunction: { desc: 'Blends and concentrates the energies of both planets in one spot.', type: 'Concentration' },
  sextile: { desc: 'Creates a cooperative, exciting potential that you can easily tap into.', type: 'Opportunity' },
  square: { desc: 'Introduces internal tension that motivates you to take action and grow.', type: 'Challenge' },
  trine: { desc: 'Indicates a natural talent, effortless flow of energy, and lucky gift.', type: 'Harmony' },
  opposition: { desc: 'Presents a polarity you must balance, bringing awareness through relationships.', type: 'Balance' }
};

// Calculate house index (Equal House System helper)
function getPlanetHouse(planetLongitude: number, ascendant: number): number {
  const diff = (planetLongitude - ascendant + 360) % 360;
  return Math.floor(diff / 30) + 1;
}

export default function BirthChartPage() {
  const savedOdisId = typeof window !== 'undefined' ? localStorage.getItem(ODIS_ID_KEY) : null;
  const [activeTab, setActiveTab] = useState<'chart' | 'houses' | 'aspects' | 'energy'>('chart');

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

  // Calculate Element & Modality stats
  const elementAndModalityStats = useMemo(() => {
    if (!chartData) return null;
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };

    chartData.planets.forEach(p => {
      const el = ELEMENT_FOR_SIGN[p.sign] || 'Fire';
      elements[el as keyof typeof elements] += 1;

      const cardinal = ['Aries', 'Cancer', 'Libra', 'Capricorn'];
      const fixed = ['Taurus', 'Leo', 'Scorpio', 'Aquarius'];
      const mutable = ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'];

      if (cardinal.includes(p.sign)) modalities.Cardinal += 1;
      else if (fixed.includes(p.sign)) modalities.Fixed += 1;
      else if (mutable.includes(p.sign)) modalities.Mutable += 1;
    });

    let dominantElement = 'Fire';
    let maxCount = -1;
    Object.entries(elements).forEach(([el, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantElement = el;
      }
    });

    return { elements, modalities, dominantElement };
  }, [chartData]);

  // Group planets by house placements
  const planetsByHouse = useMemo(() => {
    if (!chartData) return {};
    const grouped: Record<number, typeof chartData.planets> = {};
    for (let h = 1; h <= 12; h++) {
      grouped[h] = [];
    }
    chartData.planets.forEach(p => {
      const h = getPlanetHouse(p.longitude, chartData.ascendant);
      if (grouped[h]) {
        grouped[h].push(p);
      }
    });
    return grouped;
  }, [chartData]);

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

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-a3 gap-1 overflow-x-auto pb-px">
                <Button
                  variant={activeTab === 'chart' ? 'gold' : 'ghost'}
                  onClick={() => setActiveTab('chart')}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-9"
                  data-state={activeTab === 'chart' ? 'active' : ''}
                >
                  <Stars className="w-4 h-4 mr-2" />
                  Natal Wheel & Placements
                </Button>
                <Button
                  variant={activeTab === 'houses' ? 'gold' : 'ghost'}
                  onClick={() => setActiveTab('houses')}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-9"
                  data-state={activeTab === 'houses' ? 'active' : ''}
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Houses Decoded
                </Button>
                <Button
                  variant={activeTab === 'aspects' ? 'gold' : 'ghost'}
                  onClick={() => setActiveTab('aspects')}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-9"
                  data-state={activeTab === 'aspects' ? 'active' : ''}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Aspects Explained
                </Button>
                <Button
                  variant={activeTab === 'energy' ? 'gold' : 'ghost'}
                  onClick={() => setActiveTab('energy')}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-9"
                  data-state={activeTab === 'energy' ? 'active' : ''}
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Cosmic Energy Balance
                </Button>
              </div>

              {/* Tab Content 1: Natal Wheel & Placements */}
              {activeTab === 'chart' && (
                <div className="space-y-8 animate-fade-in">
                  <Card variant="frosted" className="border-gray-5/20 shadow-2xl">
                    <CardContent className="py-8">
                      <BirthChart chartData={chartData} />
                    </CardContent>
                  </Card>

                  {/* Primal Triad Insights */}
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

              {/* Tab Content 2: Houses Decoded */}
              {activeTab === 'houses' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-left space-y-1">
                    <h2 className="text-4 font-black text-white">Your House Placements</h2>
                    <p className="text-xs text-gray-11">
                      Houses map the areas of your life where planetary energies play out. Here is where your planets reside:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(HOUSE_DESCRIPTIONS).map(([hNumStr, hDesc]) => {
                      const hNum = parseInt(hNumStr);
                      const planets = planetsByHouse[hNum] || [];
                      const HouseIcon = hDesc.icon;

                      return (
                        <Card key={hNum} variant={planets.length > 0 ? 'frosted' : 'glass'} className={planets.length > 0 ? 'border-amber-9/20' : 'opacity-70'}>
                          <CardHeader className="py-4 flex flex-row items-start justify-between gap-4 border-b border-gray-a3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${planets.length > 0 ? 'bg-amber-9/10 text-amber-11' : 'bg-gray-a2 text-gray-11'}`}>
                                <HouseIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-sm font-black text-white">{hDesc.name}</CardTitle>
                                <CardDescription className="text-[11px] text-gray-11 leading-relaxed mt-0.5">{hDesc.meaning}</CardDescription>
                              </div>
                            </div>
                            {planets.length > 0 ? (
                              <Badge variant="gold" size="sm">
                                {planets.length} {planets.length === 1 ? 'placement' : 'placements'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" size="sm" className="opacity-50">Empty</Badge>
                            )}
                          </CardHeader>
                          <CardContent className="py-4">
                            {planets.length > 0 ? (
                              <div className="space-y-4">
                                {planets.map(planet => (
                                  <div key={planet.name} className="flex items-start gap-3 text-xs bg-gray-a1 p-3 rounded-lg border border-gray-a2">
                                    <span style={{ color: planet.color }} className="text-lg font-black shrink-0 leading-none mt-0.5">
                                      {planet.glyph}
                                    </span>
                                    <div>
                                      <span className="font-bold text-white uppercase tracking-wider text-[10px] mr-1.5">{planet.name} in {planet.sign}:</span>
                                      <span className="text-gray-11 leading-relaxed">
                                        {PLANET_IN_HOUSE_INTERPRETATIONS[planet.name] || 'Brings its unique cosmic essence and energy pattern directly into this domain.'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-11 italic">
                                No major planets occupy this house. Its themes are ruled transitively by the sign {chartData.houses[hNum - 1]?.sign}.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab Content 3: Aspects Explained */}
              {activeTab === 'aspects' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-left space-y-1">
                    <h2 className="text-4 font-black text-white">Astrological Aspect Dynamics</h2>
                    <p className="text-xs text-gray-11">
                      Aspects represent the geometry and mathematical angles formed between planets. They show where your energies cooperate or experience creative friction:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {Object.entries(ASPECT_EXPLANATIONS).map(([type, value]) => (
                      <Card key={type} variant="glass" className="text-center py-4 px-3 flex flex-col justify-between">
                        <div>
                          <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                            type === 'conjunction' ? 'bg-amber-9/10 text-amber-11' :
                            type === 'trine' || type === 'sextile' ? 'bg-blue-500/10 text-blue-11' : 'bg-red-500/10 text-red-11'
                          }`}>
                            {type === 'conjunction' ? '☌' : type === 'sextile' ? '⚹' : type === 'square' ? '□' : type === 'trine' ? '△' : '☍'}
                          </div>
                          <h4 className="text-xs font-black uppercase text-white tracking-wider">{type}</h4>
                          <Badge variant="outline" className="my-1.5 text-[9px] font-bold uppercase tracking-tight">{value.type}</Badge>
                        </div>
                        <p className="text-[10px] text-gray-11 mt-1 leading-snug">{value.desc}</p>
                      </Card>
                    ))}
                  </div>

                  <Card variant="frosted">
                    <CardHeader className="border-b border-gray-a3 pb-4">
                      <CardTitle className="text-sm font-black text-white">Your Personal Aspects Breakdown</CardTitle>
                      <CardDescription className="text-xs text-gray-11">
                        Listed in order of exactness (smallest orb value representing strongest connection).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                      {chartData.aspects.length > 0 ? (
                        <div className="space-y-3">
                          {chartData.aspects.map((aspect, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-gray-a2 border border-gray-a3">
                              <div className="flex items-center gap-2 text-xs">
                                <span style={{ color: PLANET_COLORS[aspect.planet1] }} className="text-sm font-bold">
                                  {PLANET_GLYPHS[aspect.planet1]}
                                </span>
                                <span className="font-bold text-white">{aspect.planet1}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  aspect.type === 'conjunction' ? 'bg-amber-9/10 text-amber-11 border border-amber-9/20' :
                                  aspect.harmonious ? 'bg-blue-500/10 text-blue-11 border border-blue-500/20' :
                                  'bg-red-500/10 text-red-11 border border-red-500/20'
                                }`}>
                                  {aspect.symbol} {aspect.type}
                                </span>
                                <span className="font-bold text-white">{aspect.planet2}</span>
                                <span style={{ color: PLANET_COLORS[aspect.planet2] }} className="text-sm font-bold">
                                  {PLANET_GLYPHS[aspect.planet2]}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-11 leading-relaxed max-w-sm">
                                <strong>Dynamics:</strong> The {aspect.planet1} interacts with {aspect.planet2} in a{' '}
                                {aspect.harmonious ? 'supportive, fluid' : 'motivating, high-tension'} way.{' '}
                                {ASPECT_EXPLANATIONS[aspect.type]?.desc} (Orb: {aspect.orb.toFixed(2)}°)
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-gray-11 italic">No major aspects detected.</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tab Content 4: Cosmic Energy Balance */}
              {activeTab === 'energy' && elementAndModalityStats && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-left space-y-1">
                    <h2 className="text-4 font-black text-white">Astrological Element & Modality Balance</h2>
                    <p className="text-xs text-gray-11">
                      Astrology divides signs into four elements (Fire, Earth, Air, Water) and three modalities (Cardinal, Fixed, Mutable). This shows your dominant energetic temperament:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Elements Breakdown */}
                    <Card variant="frosted">
                      <CardHeader className="border-b border-gray-a3 pb-4">
                        <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-amber-9" />
                          Elements (Your Temperament)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4 space-y-4">
                        {Object.entries(elementAndModalityStats.elements).map(([el, count]) => {
                          const percent = (count / 10) * 100;
                          let barColor = 'bg-blue-500';
                          if (el === 'Fire') barColor = 'bg-red-500';
                          else if (el === 'Earth') barColor = 'bg-green-500';
                          else if (el === 'Air') barColor = 'bg-sky-400';

                          return (
                            <div key={el} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-bold text-white">
                                <span>{el}</span>
                                <span className="text-gray-11">{count} / 10 ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-a2 overflow-hidden border border-gray-a3">
                                <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Modalities Breakdown */}
                    <Card variant="frosted">
                      <CardHeader className="border-b border-gray-a3 pb-4">
                        <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          Modalities (Your Action Style)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4 space-y-4">
                        {Object.entries(elementAndModalityStats.modalities).map(([mod, count]) => {
                          const percent = (count / 10) * 100;
                          return (
                            <div key={mod} className="space-y-1.5 text-xs">
                              <div className="flex justify-between font-bold text-white">
                                <span>{mod}</span>
                                <span className="text-gray-11">{count} / 10 ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-a2 overflow-hidden border border-gray-a3">
                                <div className="h-full bg-orange-500" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dominant Element Insight */}
                  <Card variant="glow">
                    <CardHeader className="border-b border-gray-a3 pb-4">
                      <CardTitle className="text-sm font-black text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-9 animate-pulse" />
                        Dominant Energy: {elementAndModalityStats.dominantElement}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-4 text-xs text-gray-11 leading-relaxed">
                      You are highly <strong>{elementAndModalityStats.dominantElement}-dominant</strong>. This indicates that your life energy and personality are{' '}
                      {DOMINANT_ENERGY_TEXTS[elementAndModalityStats.dominantElement]}. You can balance this dominant energy by cultivating and working with the traits of its polar opposite element.
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
