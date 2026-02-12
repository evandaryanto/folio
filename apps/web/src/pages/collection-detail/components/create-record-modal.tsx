import { useState, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldResponse } from "@folio/contract/field";
import { FieldType } from "@folio/contract/enums";

interface CreateRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FieldResponse[];
  onCreate: (data: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
}

export function CreateRecordModal({
  open,
  onOpenChange,
  fields,
  onCreate,
  isLoading,
}: CreateRecordModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sort fields by sortOrder
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.sortOrder - b.sortOrder),
    [fields],
  );

  const handleFieldChange = (slug: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [slug]: value }));
    // Clear error when field is changed
    if (errors[slug]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of sortedFields) {
      if (field.isRequired) {
        const value = formData[field.slug];
        if (value === undefined || value === null || value === "") {
          newErrors[field.slug] = `${field.name} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onCreate(formData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({});
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  if (fields.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Record</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No fields defined</p>
            <p className="text-sm text-muted-foreground">
              Add fields to your collection schema before creating records.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {sortedFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={formData[field.slug]}
              onChange={(value) => handleFieldChange(field.slug, value)}
              error={errors[field.slug]}
            />
          ))}
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface FieldInputProps {
  field: FieldResponse;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function FieldInput({ field, value, onChange, error }: FieldInputProps) {
  const inputId = `field-${field.slug}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="flex items-center gap-1">
        {field.name}
        {field.isRequired && <span className="text-destructive">*</span>}
      </Label>

      {renderInput(field, value, onChange, inputId)}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function renderInput(
  field: FieldResponse,
  value: unknown,
  onChange: (value: unknown) => void,
  inputId: string,
) {
  const baseInputClass =
    "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  switch (field.fieldType) {
    case FieldType.Text:
      return (
        <input
          id={inputId}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );

    case FieldType.Textarea:
      return (
        <Textarea
          id={inputId}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
          rows={3}
        />
      );

    case FieldType.Number:
      return (
        <input
          id={inputId}
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
          className={baseInputClass}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );

    case FieldType.Boolean:
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={inputId}
            checked={(value as boolean) ?? false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={inputId} className="text-sm text-muted-foreground">
            {field.name}
          </Label>
        </div>
      );

    case FieldType.Date:
      return (
        <input
          id={inputId}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case FieldType.Datetime:
      return (
        <input
          id={inputId}
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case FieldType.Select: {
      const choices = field.options?.choices ?? [];
      return (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger id={inputId}>
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case FieldType.MultiSelect: {
      const choices = field.options?.choices ?? [];
      const selectedValues = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          {choices.map((choice) => (
            <div key={choice.value} className="flex items-center gap-2">
              <Checkbox
                id={`${inputId}-${choice.value}`}
                checked={selectedValues.includes(choice.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedValues, choice.value]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== choice.value));
                  }
                }}
              />
              <Label
                htmlFor={`${inputId}-${choice.value}`}
                className="text-sm font-normal"
              >
                {choice.label}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case FieldType.Json:
      return (
        <Textarea
          id={inputId}
          value={
            typeof value === "string"
              ? value
              : JSON.stringify(value ?? {}, null, 2)
          }
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Keep as string if invalid JSON
              onChange(e.target.value);
            }
          }}
          placeholder='{"key": "value"}'
          rows={4}
          className="font-mono text-xs"
        />
      );

    case FieldType.Relation:
      // For now, just use a text input for relation IDs
      return (
        <input
          id={inputId}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder="Enter related record ID"
        />
      );

    default:
      return (
        <input
          id={inputId}
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      );
  }
}
