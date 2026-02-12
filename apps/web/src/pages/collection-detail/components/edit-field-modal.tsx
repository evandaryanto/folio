import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FieldType } from "@folio/contract/enums";
import type { FieldResponse } from "@folio/contract/field";
import type { UpdateFieldRequest } from "@folio/contract/field";

interface EditFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: FieldResponse | null;
  onUpdate: (data: UpdateFieldRequest) => Promise<void>;
  isLoading: boolean;
}

interface Choice {
  value: string;
  label: string;
}

export function EditFieldModal({
  open,
  onOpenChange,
  field,
  onUpdate,
  isLoading,
}: EditFieldModalProps) {
  const [name, setName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [isUnique, setIsUnique] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when field changes
  useEffect(() => {
    if (field) {
      setName(field.name);
      setIsRequired(field.isRequired);
      setIsUnique(field.isUnique);
      setChoices(field.options?.choices ?? []);
      setErrors({});
    }
  }, [field]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (
      field &&
      (field.fieldType === FieldType.Select ||
        field.fieldType === FieldType.MultiSelect) &&
      choices.length === 0
    ) {
      newErrors.choices = "At least one choice is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !field) return;

    const data: UpdateFieldRequest = {
      name,
      isRequired,
      isUnique,
    };

    // Add options for Select/MultiSelect
    if (
      field.fieldType === FieldType.Select ||
      field.fieldType === FieldType.MultiSelect
    ) {
      data.options = { choices };
    }

    await onUpdate(data);
    handleOpenChange(false);
  };

  const addChoice = () => {
    setChoices([...choices, { value: "", label: "" }]);
  };

  const updateChoice = (
    index: number,
    choiceField: "value" | "label",
    value: string,
  ) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [choiceField]: value };
    // Auto-generate value from label if value is empty
    if (choiceField === "label" && !newChoices[index].value) {
      newChoices[index].value = generateSlug(value);
    }
    setChoices(newChoices);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  if (!field) return null;

  const showChoicesField =
    field.fieldType === FieldType.Select ||
    field.fieldType === FieldType.MultiSelect;

  const baseInputClass =
    "w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Read-only info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <code className="font-mono text-sm">{field.slug}</code>
            </div>
            <Badge variant="outline" className="ml-auto">
              {field.fieldType}
            </Badge>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-field-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <input
              id="edit-field-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={baseInputClass}
              placeholder="e.g., First Name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Choices for Select/MultiSelect */}
          {showChoicesField && (
            <div className="space-y-2">
              <Label>
                Choices <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {choices.map((choice, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={choice.label}
                        onChange={(e) =>
                          updateChoice(index, "label", e.target.value)
                        }
                        className={baseInputClass}
                        placeholder="Label"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={choice.value}
                        onChange={(e) =>
                          updateChoice(index, "value", e.target.value)
                        }
                        className={`${baseInputClass} font-mono`}
                        placeholder="value"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeChoice(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Choice
                </Button>
              </div>
              {errors.choices && (
                <p className="text-sm text-destructive">{errors.choices}</p>
              )}
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-field-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <Label htmlFor="edit-field-required" className="text-sm font-normal">
                Required
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-field-unique"
                checked={isUnique}
                onCheckedChange={(checked) => setIsUnique(checked === true)}
              />
              <Label htmlFor="edit-field-unique" className="text-sm font-normal">
                Unique
              </Label>
            </div>
          </div>

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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
