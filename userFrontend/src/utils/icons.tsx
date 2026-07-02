import {
  Accessibility,
  BedDouble,
  Building2,
  Cake,
  Car,
  Flower2,
  Gem,
  HelpCircle,
  Lightbulb,
  Presentation,
  Projector,
  ShieldCheck,
  Snowflake,
  Speaker,
  Trees,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
  type LucideIcon,
} from 'lucide-react';

/** Resolve a stored icon name (from mock data) to a Lucide component. */
const registry: Record<string, LucideIcon> = {
  Gem,
  Cake,
  Presentation,
  Building2,
  Users,
  Car,
  Wifi,
  Snowflake,
  UtensilsCrossed,
  Projector,
  Lightbulb,
  Flower2,
  BedDouble,
  Waves,
  Trees,
  Wine,
  Speaker,
  ShieldCheck,
  Accessibility,
};

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = registry[name] ?? HelpCircle;
  return <Icon className={className} />;
}
