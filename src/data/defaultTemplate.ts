import { PortfolioMetadata, PortfolioNode, TemplateDefinition } from "../types";
import { createId } from "../utils/id";

const createFolder = (
  name: string,
  required = true,
  kind: "folder" | "file" | "multiFile" = "folder",
  children: PortfolioNode[] = [],
  options: Partial<PortfolioNode> = {},
): PortfolioNode => ({
  id: createId(),
  name,
  kind,
  required,
  children,
  ...options,
});

export const defaultMetadata: PortfolioMetadata = {
  portfolioTitle: "Course Portfolio",
  semester: "Spring2026",
  courseCode: "COURSE101",
  section: "Section01",
  namingPattern: "{semester}_{courseCode}_{section}_{itemType}_{fileRole}",
};

const createUploadFolder = (name: string) =>
  createFolder(name, true, "multiFile", [], {
    allowMultipleFiles: true,
    renameBehavior: "preserve",
  });

export const createDefaultTemplate = (): TemplateDefinition => ({
  id: createId(),
  name: "Default Course Portfolio",
  createdAt: new Date().toISOString(),
  metadataDefaults: defaultMetadata,
  root: createFolder("Course Portfolio", true, "folder", [
    createUploadFolder("1_Delivered Syllabus_Lect Notes"),
    createFolder("2_Assessment Instruments", true, "folder", [
      createUploadFolder("1_Assignments"),
      createUploadFolder("2_Exams"),
      createUploadFolder("3_Project"),
      createUploadFolder("4_Quizzes"),
    ]),
    createFolder("3_Student Graded_Samples", true, "folder", [
      createUploadFolder("Assignments"),
      createUploadFolder("Exams"),
      createUploadFolder("Projects"),
      createUploadFolder("Quizzes"),
    ]),
    createUploadFolder("4_Reports"),
  ]),
});
