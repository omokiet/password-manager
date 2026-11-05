import { useIsMobile } from '../shared/hooks/useIsMobile';
import DesktopDashboard from '../desktop/DesktopDashboard';
import MobileDashboard from '../mobile/MobileDashboard';

interface Props {
  onLock: () => void;
}

export default function Dashboard({ onLock }: Props) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDashboard onLock={onLock} /> : <DesktopDashboard onLock={onLock} />;
}
