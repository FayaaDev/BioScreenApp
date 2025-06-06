import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Heart, 
  Eye, 
  Activity, 
  Search, 
  Shield, 
  ClipboardCheck,
  Bone,
  Calendar,
  Clock
} from "lucide-react";
import { getScreeningStatusClass, getScreeningStatusLabel, getScreeningIcon } from "@/lib/screening-utils";
import { getTimeFromNow, formatDate, getOverdueTime } from "@/lib/date-utils";
import { getSehhatyAppLink } from "@/lib/device-utils";
import type { ScreeningWithDetails } from "@/lib/screening-utils";

interface ScreeningCardProps {
  screening: ScreeningWithDetails;
  onSchedule?: () => void;
  onMarkCompleted?: () => void;
  isRTL?: boolean;
  userBirthDate?: string;
}

const iconMap = {
  heart: Heart,
  eye: Eye,
  activity: Activity,
  search: Search,
  shield: Shield,
  'clipboard-check': ClipboardCheck,
  bone: Bone,
};

export function ScreeningCard({ screening, onSchedule, onMarkCompleted, isRTL = false, userBirthDate }: ScreeningCardProps) {
  const { t, i18n } = useTranslation();
  const IconComponent = iconMap[getScreeningIcon(screening.screening?.category || 'general') as keyof typeof iconMap] || Activity;
  const statusClass = getScreeningStatusClass(screening.status);
  const statusLabel = getScreeningStatusLabel(screening.status);
  
  const timeFromNow = getTimeFromNow(screening.nextDue);
  const isCompleted = screening.status === 'completed';

  // Helper function to get frequency text in Arabic
  const getFrequencyText = (years: number) => {
    if (i18n.language === 'ar') {
      if (years === 0) return t("screening.noRepetition");
      if (years === 1) return "كل سنة";
      if (years === 2) return "كل سنتين";
      return `كل ${years} سنين`;
    }
    return t("screening.everyYear", { count: years });
  };

  return (
    <Card className={`${statusClass} border bg-white`}>
      <CardContent className="p-4">
        <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            screening.status === 'due' ? 'bg-blue-500' :
            screening.status === 'overdue' ? 'bg-red-500' :
            screening.status === 'later' ? 'bg-orange-500' :
            screening.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {screening.screening?.iconUrl ? (
              <img 
                src={screening.screening.iconUrl} 
                alt={screening.screening.name}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <IconComponent className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={`flex items-center justify-between mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className={`font-semibold text-gray-900 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                {screening.screening?.name || 'Unknown Screening'}
              </h3>
              <div className={`flex flex-col space-y-1 ${isRTL ? 'items-start' : 'items-end'}`}>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    screening.status === 'due' ? 'bg-blue-100 text-blue-800' :
                    screening.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    screening.status === 'later' ? 'bg-orange-100 text-orange-800' :
                    screening.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {statusLabel}
                </Badge>
                {screening.screening?.priority && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      screening.screening.priority === 'strongly_recommended' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-red-400 text-white'
                    }`}
                  >
                    {screening.screening.priority === 'strongly_recommended' ? 'موصى به بشدة' : 'موصى به'}
                  </Badge>
                )}
              </div>
            </div>
            
            <p className={`text-sm text-gray-600 mb-2 line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {screening.screening?.description || 'No description available'}
            </p>
            
            <div className={`flex items-center justify-between text-xs mb-3 ${isRTL ? 'flex-row-reverse' : ''} text-gray-700`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                <span>
                  {screening.status === 'overdue' && userBirthDate
                    ? getOverdueTime(userBirthDate, screening.screening?.startAge || 0)
                    : getFrequencyText(screening.screening?.frequencyYears || 1)
                  }
                </span>
              </div>
              {/*<div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>*/}
                {/*<Calendar className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                <span>
                  {isCompleted ? t("screening.completed", { time: timeFromNow }) : t("screening.due", { time: timeFromNow })}
                </span>
              </div>*/}
            </div>
            
            {screening.status === 'later' && screening.screening?.startAge && (
              <p className={`text-xs mb-3 ${isRTL ? 'text-right' : 'text-left'} text-gray-700`}>
                {t("screening.takeAtAge", { age: screening.screening.startAge })}
              </p>
            )}
            
            {isCompleted && screening.screening?.frequencyYears && screening.screening.frequencyYears > 0 && (
              <p className={`text-xs mb-3 ${isRTL ? 'text-right' : 'text-left'} text-gray-700`}>
                {t("screening.nextDue", { date: formatDate(screening.nextDue) })}
              </p>
            )}
            
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {!isCompleted && (
                <Button 
                  size="sm" 
                  onClick={() => {
                    const appLink = getSehhatyAppLink();
                    window.open(appLink, '_blank');
                    if (onSchedule) onSchedule();
                  }}
                  className={`${
                    screening.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' :
                    screening.status === 'due' ? 'bg-blue-600 hover:bg-blue-700' :
                    screening.status === 'later' ? 'bg-gray-600 hover:bg-gray-700' : 'text-white hover:opacity-90'
                  }`}
                >
                  {t("home.bookWithSehhaty")}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onMarkCompleted}
                className="text-xs"
              >
                {isCompleted ? "غير مكتمل" : t("home.markComplete")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
