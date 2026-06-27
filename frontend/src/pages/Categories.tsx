import { useState, useEffect, useCallback, type FormEvent } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/api/categories";
import type { Category } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Utensils,
  Car,
  ShoppingBag,
  FileText,
  Film,
  MoreHorizontal,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

const COLOR_OPTIONS = CATEGORIES.map((c) => c.color);
const ICON_OPTIONS = [
  { name: "utensils", icon: Utensils },
  { name: "car", icon: Car },
  { name: "shopping-bag", icon: ShoppingBag },
  { name: "file-text", icon: FileText },
  { name: "film", icon: Film },
  { name: "more-horizontal", icon: MoreHorizontal },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  "file-text": FileText,
  film: Film,
  "more-horizontal": MoreHorizontal,
};

function SortableRow({
  category,
  editingId,
  editName,
  setEditName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  meta,
  onColorChange,
  onIconChange,
}: {
  category: Category;
  editingId: number | null;
  editName: string;
  setEditName: (v: string) => void;
  onStartEdit: (cat: Category) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
  onDelete: (cat: Category) => void;
  meta: { color: string; icon: string };
  onColorChange: (id: number, color: string) => void;
  onIconChange: (id: number, icon: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === category.id;
  const IconComp = ICON_MAP[meta.icon] || MoreHorizontal;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-text-muted hover:text-text p-1 -ml-1"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge dot dotColor={meta.color} size="sm" />
          <span style={{ color: meta.color }}>
            <IconComp className="h-4 w-4 flex-shrink-0" />
          </span>
        </div>
      </TableCell>
      <TableCell className="min-w-[200px]">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(category.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
          />
        ) : (
          <span className="font-medium text-text">{category.name}</span>
        )}
      </TableCell>
      <TableCell align="right">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 mr-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    meta.color === color ? "border-text scale-110" : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(category.id, color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="flex gap-1 mr-2">
              {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  className={`p-1 rounded transition-colors ${
                    meta.icon === iconName ? "bg-accent-light text-accent" : "text-text-muted hover:text-text hover:bg-bg-card-hover"
                  }`}
                  onClick={() => onIconChange(category.id, iconName)}
                  aria-label={`Select icon ${iconName}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => onSaveEdit(category.id)}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartEdit(category)}
              icon={<Edit2 className="h-4 w-4" />}
              aria-label="Edit category"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(category)}
              icon={<Trash2 className="h-4 w-4" />}
              aria-label="Delete category"
            />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Categories() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryMeta, setCategoryMeta] = useState<Record<number, { color: string; icon: string }>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const cats = await getCategories();
      setCategories(cats);
      setOrderedCategories(cats);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 401) {
        setError("Please sign in to manage your categories.");
      } else if (status === 0) {
        setError("Unable to connect to the server. Please check your connection.");
      } else {
        setError("Failed to load categories. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryMeta((prev) => {
        const meta = { ...prev };
        categories.forEach((cat) => {
          if (!meta[cat.id]) {
            const found = CATEGORIES.find(
              (c) => c.label.toLowerCase() === cat.name.toLowerCase()
            );
            meta[cat.id] = {
              color: found?.color || CATEGORIES[CATEGORIES.length - 1].color,
              icon: found?.icon || CATEGORIES[CATEGORIES.length - 1].icon,
            };
          }
        });
        return meta;
      });
    }
  }, [categories]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const cat = await createCategory(newName.trim());
      setCategories((prev) => [...prev, cat]);
      setOrderedCategories((prev) => [...prev, cat]);
      setNewName("");
      showToast("Category created", "success");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      showToast(typeof msg === "string" ? msg : "Failed to create category", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await updateCategory(id, editName.trim());
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setOrderedCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      showToast("Category updated", "success");
    } catch (err: any) {
      const msg = err.response?.data?.error;
      showToast(typeof msg === "string" ? msg : "Failed to update category", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDeleteRequest = (cat: Category) => {
    setDeleteTarget(cat);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setOrderedCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Category deleted", "success");
    } catch {
      showToast("Failed to delete category", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedCategories.findIndex((c) => c.id === active.id);
    const newIndex = orderedCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setOrderedCategories(arrayMove(orderedCategories, oldIndex, newIndex));
  };

  const handleColorChange = (id: number, color: string) => {
    setCategoryMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], color },
    }));
  };

  const handleIconChange = (id: number, icon: string) => {
    setCategoryMeta((prev) => ({
      ...prev,
      [id]: { ...prev[id], icon },
    }));
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Categories"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Categories" },
          ]}
        />
        <Card>
          <CardContent className="p-6">
            <Skeleton variant="rectangular" height="40px" className="mb-6" />
            <SkeletonTable columns={3} rows={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Categories"
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Categories" },
          ]}
        />
        <Card className="border-error/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 text-error mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-1">Unable to load categories</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <Button icon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Categories" },
        ]}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name..."
              maxLength={50}
            />
            <Button
              type="submit"
              disabled={!newName.trim()}
              loading={creating}
              icon={<Plus className="h-4 w-4" />}
            >
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {orderedCategories.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              No categories yet. Create one above.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedCategories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead className="w-14">
                        <span className="sr-only">Color</span>
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right w-[420px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedCategories.map((cat) => (
                      <SortableRow
                        key={cat.id}
                        category={cat}
                        editingId={editingId}
                        editName={editName}
                        setEditName={setEditName}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onDelete={handleDeleteRequest}
                        meta={categoryMeta[cat.id] || { color: "#FF9F40", icon: "more-horizontal" }}
                        onColorChange={handleColorChange}
                        onIconChange={handleIconChange}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
