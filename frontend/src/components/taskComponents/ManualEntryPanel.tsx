// import { useState } from "react";
// import styled from "styled-components";
// import type { Task } from "../../types/Task.ts";
//
// // ── Styled Components ────────────────────────────────────────────────────────
//
// const PanelOverlay = styled.div`
//   position: absolute;
//   top: 0;
//   left: 60%;
//   width: 40%;
//   background: #ffffff;
//   border: 1px solid #d0d0d0;
//   border-radius: 6px;
//   box-shadow: 2px 4px 16px rgba(0, 0, 0, 0.15);
//   z-index: 200;
//   display: flex;
//   flex-direction: column;
//   overflow: hidden;
// `;
//
// const PanelHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   background-color: #fff59a;
//   padding: 8px 12px;
// `;
//
// const PanelTitle = styled.span`
//   font-weight: bold;
//   font-size: 0.95rem;
//   color: #333;
// `;
//
// const MinimizeButton = styled.button`
//   background: none;
//   border: none;
//   cursor: pointer;
//   font-size: 1.1rem;
//   color: #636363;
//   line-height: 1;
//   padding: 0 2px;
//   &:hover {
//     color: black;
//   }
// `;
//
// const PanelBody = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 8px;
//   padding: 12px;
// `;
//
// const FieldLabel = styled.label`
//   font-size: 0.8rem;
//   color: #888;
//   display: flex;
//   flex-direction: column;
//   gap: 3px;
// `;
//
// const FieldInput = styled.input`
//   background-color: #fafafa;
//   color: #333;
//   border: 1px solid #e0e0e0;
//   border-radius: 3px;
//   padding: 5px 8px;
//   font-size: 0.9rem;
//   width: 100%;
//   box-sizing: border-box;
//   &:focus {
//     outline: 2px solid #d0d0d0;
//   }
// `;
//
// const FieldTextarea = styled.textarea`
//   background-color: #fafafa;
//   color: #333;
//   border: 1px solid #e0e0e0;
//   border-radius: 3px;
//   padding: 5px 8px;
//   font-size: 0.9rem;
//   resize: vertical;
//   min-height: 60px;
//   width: 100%;
//   box-sizing: border-box;
//   &:focus {
//     outline: 2px solid #d0d0d0;
//   }
// `;
//
// const FieldRow = styled.div`
//   display: flex;
//   gap: 8px;
// `;
//
// const RadioGroup = styled.div`
//   display: flex;
//   gap: 6px;
//   margin-top: 2px;
// `;
//
// const RadioOption = styled.button<{ selected: boolean }>`
//   width: 26px;
//   height: 26px;
//   border-radius: 50%;
//   border: 2px solid ${({ selected }) => (selected ? "#555" : "#ccc")};
//   background-color: ${({ selected }) => (selected ? "#555" : "#fff")};
//   color: ${({ selected }) => (selected ? "#fff" : "#888")};
//   font-size: 0.8rem;
//   font-weight: bold;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   transition: all 0.15s;
//   &:hover {
//     border-color: #555;
//   }
// `;
//
// const CreateButton = styled.button`
//   margin-top: 4px;
//   padding: 8px;
//   background-color: #333;
//   color: #fff;
//   border: none;
//   border-radius: 4px;
//   font-size: 0.9rem;
//   font-weight: bold;
//   cursor: pointer;
//   &:hover {
//     background-color: #555;
//   }
//   &:disabled {
//     background-color: #ccc;
//     cursor: not-allowed;
//   }
// `;
//
// // ── Blank form state ─────────────────────────────────────────────────────────
//
// type TaskForm = Omit<Task, "id" | "can_schedule">;
//
//
// // ── Component ────────────────────────────────────────────────────────────────
//
// type ManualEntryPanelProps = {
//   isOpen: boolean;
//   onMinimize: () => void;
//   onCreateTask: (task: Omit<Task, "id" | "can_schedule">) => Promise<void>;
// };
//
// export default function ManualEntryPanel({
//   isOpen,
//   onMinimize,
//   onCreateTask,
// }: ManualEntryPanelProps) {
//   // Form state persists across minimize/maximize cycles
//   const [form, setForm] = useState<TaskForm>({
//     title: "",
//     description: "",
//     due_date: "",
//     task_duration: 0,
//     importance: 0,
//     difficulty: 0,
//     status: "to do",
//   });
//   const [loading, setLoading] = useState(false);
//
//   const handleCreate = async () => {
//     if (!form.title.trim()) return;
//     setLoading(true);
//     try {
//       await onCreateTask({
//         title: form.title.trim(),
//         description: form.description.trim(),
//         due_date: form.due_date,
//         task_duration: Number(form.task_duration) || 0,
//         importance: form.importance,
//         difficulty: form.difficulty,
//         status: form.status,
//       });
//       setForm({
//         title: "",
//         description: "",
//         due_date: "",
//         task_duration: 0,
//         importance: 0,
//         difficulty: 0,
//         status: "to do",
//       });// reset only on successful create
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // Always render so state is preserved — just hide the body when minimized
//   return (
//     <PanelOverlay>
//       <PanelHeader>
//         <PanelTitle>New Task</PanelTitle>
//         <MinimizeButton onClick={onMinimize} title={isOpen ? "Minimize" : "Expand"}>
//           {isOpen ? "−" : "+"}
//         </MinimizeButton>
//       </PanelHeader>
//
//       {isOpen && (
//         <PanelBody>
//           <FieldLabel>
//             Title
//             <FieldInput
//               value={form.title}
//               onChange={(e) => setForm({ ...form, title: e.target.value })}
//               placeholder="Task title"
//             />
//           </FieldLabel>
//
//           <FieldLabel>
//             Description
//             <FieldTextarea
//               value={form.description}
//               onChange={(e) => setForm({ ...form, description: e.target.value })}
//               placeholder="Optional description"
//             />
//           </FieldLabel>
//
//           <FieldRow>
//             <FieldLabel>
//               Due Date
//               <FieldInput
//                 type="date"
//                 value={form.due_date}
//                 onChange={(e) => setForm({ ...form, due_date: e.target.value })}
//               />
//             </FieldLabel>
//
//             <FieldLabel>
//               Duration (min)
//               <FieldInput
//                 type="number"
//                 min={1}
//                 value={form.task_duration}
//                 onChange={(e) =>
//                   setForm({ ...form, task_duration: e.target.value as unknown as number })
//                 }
//                 placeholder="30"
//               />
//             </FieldLabel>
//           </FieldRow>
//
//           <FieldLabel>
//             Importance
//             <RadioGroup>
//               {[1, 2, 3].map((val) => (
//                 <RadioOption
//                   key={val}
//                   selected={form.importance === val}
//                   onClick={() => setForm({ ...form, importance: val })}
//                   type="button"
//                 >
//                   {val}
//                 </RadioOption>
//               ))}
//             </RadioGroup>
//           </FieldLabel>
//
//           <FieldLabel>
//             Difficulty
//             <RadioGroup>
//               {[1, 2, 3].map((val) => (
//                 <RadioOption
//                   key={val}
//                   selected={form.difficulty === val}
//                   onClick={() => setForm({ ...form, difficulty: val })}
//                   type="button"
//                 >
//                   {val}
//                 </RadioOption>
//               ))}
//             </RadioGroup>
//           </FieldLabel>
//
//           <CreateButton
//             onClick={handleCreate}
//             disabled={loading || !form.title.trim()}
//           >
//             {loading ? "Creating..." : "Create!"}
//           </CreateButton>
//         </PanelBody>
//       )}
//     </PanelOverlay>
//   );
// }
