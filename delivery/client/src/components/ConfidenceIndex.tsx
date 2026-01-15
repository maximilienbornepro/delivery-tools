import { useState, useRef, useEffect } from 'react';
import type { ConfidenceData, ConfidenceItem } from '../types';
import styles from './ConfidenceIndex.module.css';

interface ConfidenceIndexProps {
  data: ConfidenceData;
  onScoreChange: (score: number) => void;
  onAddQuestion: (label: string) => void;
  onUpdateQuestion: (id: number, label: string) => void;
  onDeleteQuestion: (id: number) => void;
  onAddImprovement: (label: string) => void;
  onUpdateImprovement: (id: number, label: string) => void;
  onDeleteImprovement: (id: number) => void;
}

export function ConfidenceIndex({
  data,
  onScoreChange,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddImprovement,
  onUpdateImprovement,
  onDeleteImprovement,
}: ConfidenceIndexProps) {
  const [editingScore, setEditingScore] = useState(false);
  const [scoreValue, setScoreValue] = useState(data.score.toString());
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingImprovementId, setEditingImprovementId] = useState<number | null>(null);
  const [newQuestionValue, setNewQuestionValue] = useState('');
  const [newImprovementValue, setNewImprovementValue] = useState('');
  const scoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScoreValue(data.score.toString());
  }, [data.score]);

  const getScoreColor = (score: number): string => {
    if (score >= 4) return '#059669';
    if (score >= 3) return '#f59e0b';
    return '#dc2626';
  };

  const handleScoreClick = () => {
    setEditingScore(true);
    setTimeout(() => scoreInputRef.current?.select(), 0);
  };

  const handleScoreSave = () => {
    const newScore = parseFloat(scoreValue.replace(',', '.'));
    if (!isNaN(newScore) && newScore >= 0 && newScore <= 5) {
      onScoreChange(newScore);
    } else {
      setScoreValue(data.score.toString());
    }
    setEditingScore(false);
  };

  const handleScoreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScoreSave();
    } else if (e.key === 'Escape') {
      setScoreValue(data.score.toString());
      setEditingScore(false);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestionValue.trim()) {
      onAddQuestion(newQuestionValue.trim());
      setNewQuestionValue('');
    }
  };

  const handleAddImprovement = () => {
    if (newImprovementValue.trim()) {
      onAddImprovement(newImprovementValue.trim());
      setNewImprovementValue('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>INDICE DE CONFIANCE</span>
      </div>
      <div className={styles.content}>
        <div className={styles.scoreSection}>
          {editingScore ? (
            <input
              ref={scoreInputRef}
              type="text"
              className={styles.scoreInput}
              value={scoreValue}
              onChange={(e) => setScoreValue(e.target.value)}
              onBlur={handleScoreSave}
              onKeyDown={handleScoreKeyDown}
              autoFocus
            />
          ) : (
            <span
              className={styles.score}
              style={{ color: getScoreColor(data.score), cursor: 'pointer' }}
              onClick={handleScoreClick}
              title="Cliquer pour modifier"
            >
              {data.score.toFixed(1).replace('.', ',')}
            </span>
          )}
        </div>

        <div className={styles.questionsSection}>
          <div className={styles.sectionTitle}>Risques / Questions</div>
          {data.questions.map((question) => (
            <EditableItem
              key={question.id}
              item={question}
              isEditing={editingQuestionId === question.id}
              onStartEdit={() => setEditingQuestionId(question.id)}
              onSave={(label) => {
                onUpdateQuestion(question.id, label);
                setEditingQuestionId(null);
              }}
              onCancel={() => setEditingQuestionId(null)}
              onDelete={() => onDeleteQuestion(question.id)}
              icon="?"
            />
          ))}
          <div className={styles.addItemRow}>
            <input
              type="text"
              className={styles.addInput}
              placeholder="Ajouter un risque..."
              value={newQuestionValue}
              onChange={(e) => setNewQuestionValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
            />
            <button className={styles.addBtn} onClick={handleAddQuestion}>+</button>
          </div>
        </div>

        <div className={styles.improvements}>
          <h3 className={styles.improvementsTitle}>
            Comment ameliorer cet indice de confiance ?
          </h3>
          {data.improvements.map((improvement) => (
            <EditableItem
              key={improvement.id}
              item={improvement}
              isEditing={editingImprovementId === improvement.id}
              onStartEdit={() => setEditingImprovementId(improvement.id)}
              onSave={(label) => {
                onUpdateImprovement(improvement.id, label);
                setEditingImprovementId(null);
              }}
              onCancel={() => setEditingImprovementId(null)}
              onDelete={() => onDeleteImprovement(improvement.id)}
              icon="•"
            />
          ))}
          <div className={styles.addItemRow}>
            <input
              type="text"
              className={styles.addInput}
              placeholder="Ajouter une amelioration..."
              value={newImprovementValue}
              onChange={(e) => setNewImprovementValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddImprovement()}
            />
            <button className={styles.addBtn} onClick={handleAddImprovement}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditableItemProps {
  item: ConfidenceItem;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (label: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  icon: string;
}

function EditableItem({ item, isEditing, onStartEdit, onSave, onCancel, onDelete, icon }: EditableItemProps) {
  const [value, setValue] = useState(item.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(item.label);
  }, [item.label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(item.label);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={styles.questionBox}>
        <input
          ref={inputRef}
          type="text"
          className={styles.editInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      </div>
    );
  }

  return (
    <div className={styles.questionBox}>
      <span
        className={styles.questionLabel}
        onDoubleClick={onStartEdit}
        title="Double-cliquer pour modifier"
      >
        {item.label}
      </span>
      <div className={styles.itemActions}>
        <span className={styles.questionMark}>{icon}</span>
        <button className={styles.deleteItemBtn} onClick={onDelete} title="Supprimer">×</button>
      </div>
    </div>
  );
}
