"use client";

import { useState, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Filter, User, ChevronDown } from "lucide-react";
import { projects, tasks as initialTasks, Task, Priority, TaskStatus } from "@/data/mockData";

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: "High", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Low", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
};

const priorityEmoji: Record<Priority, string> = { high: "🔴", medium: "🟡", low: "🟢" };

const columns: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "inprogress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const assignees = ["All", "Eli", "Scout", "Pen", "Closer", "Buzz", "Ledger", "Ori"];

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const project = projects.find((p) => p.id === task.projectId);
  const p = priorityConfig[task.priority];
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done";

  return (
    <div
      className={`task-card bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60 shadow-2xl border-primary/50" : "border-border hover:border-border/80"
      }`}
    >
      {/* Project badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: project?.colorHex + "22", color: project?.colorHex }}
        >
          {project?.name}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.bg} ${p.color} border ${p.border}`}>
          {priorityEmoji[task.priority]} {p.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground mb-2 leading-tight">{task.title}</h4>

      {/* Progress bar */}
      {task.status === "inprogress" && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User size={11} />
          <span>{task.assignee}</span>
        </div>
        <span className={`text-xs ${isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"}`}>
          {isOverdue ? "⚠️ " : ""}
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
}: {
  column: { id: TaskStatus; label: string };
  tasks: Task[];
}) {
  const columnColors: Record<TaskStatus, string> = {
    todo: "text-muted-foreground",
    inprogress: "text-blue-400",
    done: "text-green-400",
  };

  return (
    <div className="flex flex-col bg-muted/30 rounded-xl p-3 min-h-[400px] min-w-[260px] flex-1">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${columnColors[column.id]}`}>{column.label}</span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Plus size={14} />
        </button>
      </div>

      {/* Tasks */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("All");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = tasks.filter((t) => {
    const projectMatch = selectedProject === null || t.projectId === selectedProject;
    const assigneeMatch = selectedAssignee === "All" || t.assignee === selectedAssignee;
    return projectMatch && assigneeMatch;
  });

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: overColumn.id } : t
        )
      );
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Move to column if dropped on column ID
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: overColumn.id } : t
        )
      );
      return;
    }

    // Move to column of target task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: overTask.status } : t
        )
      );
    }
  }, [tasks]);

  const stats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter((t) => t.status === "todo").length,
    inprogress: filteredTasks.filter((t) => t.status === "inprogress").length,
    done: filteredTasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Project filter */}
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: selectedProject
                  ? projects.find((p) => p.id === selectedProject)?.colorHex
                  : "#6b7280",
              }}
            />
            {selectedProject
              ? projects.find((p) => p.id === selectedProject)?.name
              : "All Projects"}
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
          {showProjectDropdown && (
            <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-xl z-10 min-w-[160px]">
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                onClick={() => { setSelectedProject(null); setShowProjectDropdown(false); }}
              >
                <span className="w-2 h-2 rounded-full bg-muted-foreground" /> All Projects
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  onClick={() => { setSelectedProject(p.id); setShowProjectDropdown(false); }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colorHex }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-muted-foreground" />
          {assignees.map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAssignee(a)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedAssignee === a
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span><span className="text-foreground font-medium">{stats.total}</span> total</span>
          <span><span className="text-blue-400 font-medium">{stats.inprogress}</span> active</span>
          <span><span className="text-green-400 font-medium">{stats.done}</span> done</span>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((col) => (
            <KanbanColumn key={col.id} column={col} tasks={getColumnTasks(col.id)} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
