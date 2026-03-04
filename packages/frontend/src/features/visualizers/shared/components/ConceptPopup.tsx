import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConceptDetailsView } from './ConceptDetailsView';

type UnknownRecord = Record<string, unknown>;

interface ConceptPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conceptType?: string;
  conceptState?: UnknownRecord;
  explanation?: string;
  code?: string;
}

export function ConceptPopup({
  open,
  onOpenChange,
  conceptType,
  conceptState,
  explanation,
  code,
}: ConceptPopupProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('lesson.concept', 'Concept')}</DialogTitle>
          <DialogDescription>
            {t('lesson.conceptDescription', 'This popup explains the conceptual state for the current step.')}
          </DialogDescription>
        </DialogHeader>

        <ConceptDetailsView
          conceptType={conceptType}
          conceptState={conceptState}
          explanation={explanation}
          code={code}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ConceptPopup;

