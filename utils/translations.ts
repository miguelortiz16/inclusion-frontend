export type Language = 'en' | 'es';

export interface Translations {
  sidebar: {
    title: string;
    searchPlaceholder: string;
    menu: string;
    classPlanner: string;
    aiTools: string;
    history: string;
    readyMaterials: string;
    ranking: string;
    calendar: string;
    shareWhatsApp: string;
    hideMenu: string;
    logout: string;
    logoutSuccess: string;
    logoutError: string;
  };
  feedback: {
    title: string;
    description: string;
    positive: string;
    negative: string;
    comment: string;
    commentPlaceholder: string;
    send: string;
    success: string;
    error: string;
    required: string;
  };
  common: {
    loading: string;
    error: string;
    back: string;
    exportExcel: string;
    exportWord: string;
    viewDetails: string;
    close: string;
    cancel: string;
    generate: string;
    generating: string;
  };
  unitPlanner: {
    newTool: string;
    title: string;
    subtitle: string;
    startPlanning: string;
    startPlanningSubtitle: string;
    letsStart: string;
    classHistory: string;
    calendar: {
      title: string;
    };
    features: {
      intelligentPlanning: {
        title: string;
        description: string;
      };
      clearObjectives: {
        title: string;
        description: string;
      };
      efficientOrganization: {
        title: string;
        description: string;
      };
    };
    steps: {
      basicInfo: {
        title: string;
        subtitle: string;
        className: string;
        classNamePlaceholder: string;
        educationalLevel: string;
        educationalLevelPlaceholder: string;
        subject: string;
        subjectPlaceholder: string;
        back: string;
        next: string;
      };
      classDetails: {
        title: string;
        subtitle: string;
        methodology: string;
        methodologyPlaceholder: string;
        classContent: string;
        classContentPlaceholder: string;
        standards: string;
        standardsPlaceholder: string;
        suggestions: string;
        back: string;
        next: string;
      };
      duration: {
        title: string;
        subtitle: string;
        classLength: string;
        lessons: string;
        back: string;
        viewDetails: string;
        processing: string;
      };
    };
    validation: {
      classNameRequired: string;
      subjectRequired: string;
      classContentRequired: string;
      standardsRequired: string;
      pleaseCompleteFields: string;
    };
    history: {
      title: string;
      subtitle: string;
      backToPlanner: string;
      generateQuestions: string;
      generateQuestionsSubtitle: string;
      selectMultipleUnits: string;
      generateCombinedQuestions: string;
      generateCombinedQuestionsDescription: string;
      educationalLevel: string;
      allLevels: string;
      subject: string;
      allSubjects: string;
      searchPlaceholder: string;
      selectAll: string;
      deselectAll: string;
      lessons: string;
      lesson: string;
      viewDetails: string;
      deletePlan: string;
      deleteConfirmation: string;
      deleteConfirmationDescription: string;
      cancel: string;
      delete: string;
      generateQuestionsDialog: {
        title: string;
        description: string;
        selectedUnits: string;
        questionType: string;
        questionTypePlaceholder: string;
        numberOfQuestions: string;
        numberOfQuestionsPlaceholder: string;
        difficultyLevel: string;
        difficultyLevelPlaceholder: string;
        generating: string;
        generate: string;
      };
      questionTypes: {
        multipleChoice: string;
        fillInTheBlank: string;
        trueFalse: string;
        writtenResponse: string;
        multipleChoiceAndFillInTheBlank: string;
        multipleChoiceAndTrueFalse: string;
        multipleChoiceAndWrittenResponse: string;
      };
      difficultyLevels: {
        low: string;
        medium: string;
        high: string;
      };
      noResults: string;
      noActiveClasses: string;
      earlyChildhoodEducation: string;
      university: string;
      grade: string;
    };
    view: {
      backToPlanner: string;
      status: {
        active: string;
      };
      sections: {
        unitDetails: string;
        standardsAndObjectives: string;
        lessonPlan: string;
      };
      buttons: {
        viewDetails: string;
        exportToExcel: string;
        exportToWord: string;
      };
      dialogs: {
        lessonDetails: {
          title: string;
          close: string;
          sections: {
            start: string;
            development: string;
            closure: string;
            activities: string;
            resources: string;
            achievements: string;
            evidence: string;
            evidenceFields: {
              saber: string;
              saberHacer: string;
              ser: string;
            };
          };
          help: {
            title: string;
            description: string;
          };
          summary: string;
          mainTopic: string;
          date: string;
          estimatedDuration: string;
          minutes: string;
          status: string;
          completed: string;
          nextLesson: string;
        };
        generateQuestionnaire: {
          title: string;
          description: string;
          questionType: string;
          selectQuestionType: string;
          multipleChoice: string;
          fillInTheBlank: string;
          trueFalse: string;
          writtenResponse: string;
          multipleChoiceAndFillInTheBlank: string;
          multipleChoiceAndTrueFalse: string;
          multipleChoiceAndWrittenResponse: string;
          questionCount: string;
          selectQuestionCount: string;
          questions: string;
          difficulty: string;
          selectDifficulty: string;
          easy: string;
          medium: string;
          hard: string;
          cancel: string;
          generate: string;
          generating: string;
          success: string;
          error: string;
          pleaseLogin: string;
          questionTypes: {
            multipleChoice: string;
            fillInTheBlank: string;
            trueFalse: string;
            writtenResponse: string;
            multipleChoiceAndFillInTheBlank: string;
            multipleChoiceAndTrueFalse: string;
            multipleChoiceAndWrittenResponse: string;
          };
          difficultyLevels: {
            low: string;
            medium: string;
            high: string;
          };
        };
        generateWordSearch: {
          generate: string;
          generating: string;
          success: string;
          error: string;
        };
      };
    };
  };
  workshop: {
    title: string;
    subtitle: string;
    suggestNewTool: string;
    editAndCustomize: string;
    exportToPDF: string;
    exportToWord: string;
    shareContent: string;
    saveChanges: string;
    workingDocument: string;
    wordsToFind: string;
    bold: string;
    italic: string;
    bulletList: string;
    numberedList: string;
    undo: string;
    categories: {
      all: string;
      favorites: string;
      planning: string;
      assessment: string;
      content: string;
      communication: string;
      createTool: string;
    };
    tools: {
      dua: {
        title: string;
        description: string;
      };
      quizCreator: {
        title: string;
        description: string;
      };
      lessonPlanner: {
        title: string;
        description: string;
      };
      educationalMaterial: {
        title: string;
        description: string;
      };
      ideaGenerator: {
        title: string;
        description: string;
      };
      reasonableAdjustments: {
        title: string;
        description: string;
      };
      slides: {
        title: string;
        description: string;
      };
      wordSearch: {
        title: string;
        description: string;
      };
      freeAI: {
        title: string;
        description: string;
      };
      realWorldBenefits: {
        title: string;
        description: string;
      };
      projectGenerator: {
        title: string;
        description: string;
      };
      studentReports: {
        title: string;
        description: string;
      };
      commemorativeDates: {
        title: string;
        description: string;
      };
      grammarChecker: {
        title: string;
        description: string;
      };
      topicSummary: {
        title: string;
        description: string;
      };
      crossword: {
        title: string;
        description: string;
      };
      mindMap: {
        title: string;
        description: string;
      };
      timeline: {
        title: string;
        description: string;
      };
      conceptMap: {
        title: string;
        description: string;
      };
      questionWheel: {
        title: string;
        description: string;
      };
      parentWorkshops: {
        title: string;
        description: string;
      };
      teacherTraining: {
        title: string;
        description: string;
      };
      qualityStandards: {
        title: string;
        description: string;
      };
      activityIdeas: {
        title: string;
        description: string;
      };
      didacticSequence: {
        title: string;
        description: string;
      };
      writing: {
        title: string;
        description: string;
      };
      textQuestions: {
        title: string;
        description: string;
      };
      recoveryPlan: {
        title: string;
        description: string;
      };
      questionCorrection: {
        title: string;
        description: string;
      };
      essayGrader: {
        title: string;
        description: string;
      };
      textLeveling: {
        title: string;
        description: string;
      };
      textAccessibility: {
        title: string;
        description: string;
      };
      checklist: {
        title: string;
        description: string;
      };
      learningObjectives: {
        title: string;
        description: string;
      };
      schoolEmails: {
        title: string;
        description: string;
      };
      parentEmails: {
        title: string;
        description: string;
      };
      clearInstructions: {
        title: string;
        description: string;
      };
      paperTestCorrection: {
        title: string;
        description: string;
      };
      videoQuestions: {
        title: string;
        description: string;
      };
      steam: {
        title: string;
        description: string;
      };
      rubric: {
        title: string;
        description: string;
      };
      imageSearch: {
        title: string;
        description: string;
      };
    };
  };
  history: {
    title: string;
    subtitle: string;
    loading: string;
    error: {
      noEmail: string;
      fetchError: string;
      loadingError: string;
    };
    selectCategory: string;
    organizeMaterial: string;
    educationalResources: string;
    resources: string;
    resource: string;
    searchResources: string;
    newResource: string;
    viewResource: string;
    noResourcesFound: string;
    noResourcesInCategory: string;
    createNewResource: string;
    deleteResource: string;
    deleteResources: string;
    deleteConfirmation: string;
    deleteConfirmationDescription: string;
    cancel: string;
    delete: string;
    createResource: string;
    sure: string;
    actionCannotBeUndone: string;
    tools: {
      "crear-cuestionario": { title: string; description: string };
      "rubrica-evaluacion": { title: string; description: string };
      "sopa-de-letras": { title: string; description: string };
      "crear-plan-de-leccion": { title: string; description: string };
      "crear-material-educativo": { title: string; description: string };
      "generar-ideas": { title: string; description: string };
      "ia-libre": { title: string; description: string };
      "beneficios-del-mundo-real": { title: string; description: string };
      "generar-proyecto": { title: string; description: string };
      "generar-informe-estudiantil": { title: string; description: string };
      "generar-correo-para-padres": { title: string; description: string };
      "ideas-fechas-conmemorativas": { title: string; description: string };
      "corrector-gramatical": { title: string; description: string };
      "resumen-tema": { title: string; description: string };
      "talleres-de-padres": { title: string; description: string };
      "capacitacion-docentes": { title: string; description: string };
      "estandares-calidad-educacion": { title: string; description: string };
      "generar-ideas-actividades": { title: string; description: string };
      "generar-secuencia-didactica": { title: string; description: string };
      "generar-redaccion": { title: string; description: string };
      "generar-preguntas-texto": { title: string; description: string };
      "generar-plan-recuperacion": { title: string; description: string };
      "correccion-preguntas": { title: string; description: string };
      "calificador-ensayos": { title: string; description: string };
      "nivelacion-textos": { title: string; description: string };
      "accesibilidad-textos": { title: string; description: string };
      "generar-objetivos-aprendizaje": { title: string; description: string };
      "generar-correo-escolar": { title: string; description: string };
      "generar-instrucciones-claras": { title: string; description: string };
      "crear-cuestionario-video-youtube": { title: string; description: string };
    };
  };
  community: {
    searchPlaceholder: string;
    searchResults: string;
    subscribePremium: string;
    notifications: string;
    points: string;
    medals: string;
    feed: string;
    readyMaterials: string;
    readyMaterialsTitle: string;
    readyMaterialsDescription: string;
    communitySearch: string;
    userProfile: {
      inviteFriends: string;
      english: string;
    };
    post: {
      placeholder: string;
      forYou: string;
      like: string;
      comments: string;
      reply: string;
    };
    collaborators: {
      title: string;
      masterAI: string;
    };
    inicio: {
      title: string;
      subtitle: string;
      discover: string;
      materials: string;
      ideas: string;
      inspiration: string;
      searchPlaceholder: string;
      filterPlaceholder: string;
      allTypes: string;
      loading: string;
      viewResource: string;
      email: string;
      types: Record<string, string>;
    }
  };
  ranking: {
    title: string;
    subtitle: string;
    promotion: {
      title: string;
      description: string;
      callToAction: string;
    }
  };
  lessonPlanner: {
    title: string;
    buttons: {
      exportToPDF: string;
      exportToWord: string;
      share: string;
    };
    editor: {
      paragraph: string;
      heading1: string;
      heading2: string;
      heading3: string;
    };
    messages: {
      generating: string;
      typing: string;
      noLessonPlan: string;
      completeForm: string;
    };
    form: {
      title: string;
      help: {
        title: string;
        learningObjectives: {
          title: string;
          tip1: string;
          tip2: string;
          tip3: string;
        };
        duration: {
          title: string;
          tip1: string;
          tip2: string;
          tip3: string;
        };
      };
      fields: {
        name: {
          label: string;
          tooltip: string;
          placeholder: string;
        };
        topic: {
          label: string;
          tooltip: string;
          placeholder: string;
        };
        grade: {
          label: string;
          tooltip: string;
          placeholder: string;
          options: {
            preschool: string;
            grade1: string;
            grade2: string;
            grade3: string;
            grade4: string;
            grade5: string;
            grade6: string;
            grade7: string;
            grade8: string;
            grade9: string;
            grade10: string;
            grade11: string;
            university: string;
          };
        };
        subject: {
          label: string;
          tooltip: string;
          placeholder: string;
          options: {
            biology: string;
            naturalSciences: string;
            socialSciences: string;
            economics: string;
            artEducation: string;
            physicalEducation: string;
            physics: string;
            geography: string;
            history: string;
            english: string;
            mathematics: string;
            chemistry: string;
            language: string;
            literature: string;
            religion: string;
            politicalConstitution: string;
            ethics: string;
            philosophy: string;
            informationTechnology: string;
            environmentalEducation: string;
            afroColombianStudies: string;
            citizenshipEducation: string;
            peaceEducation: string;
            sexualityEducation: string;
            other: string;
          };
          customPlaceholder: string;
        };
        duration: {
          label: string;
          tooltip: string;
          placeholder: string;
          minutes: string;
        };
        objectives: {
          label: string;
          tooltip: string;
          placeholder: string;
        };
        methodology: {
          label: string;
          tooltip: string;
          placeholder: string;
          options: {
            lecture: string;
            activeLearning: string;
            practicalLearning: string;
            socialEmotionalLearning: string;
            caseBased: string;
            inquiryBased: string;
            researchBased: string;
            problemBased: string;
            projectBased: string;
            challengeBased: string;
            collaborative: string;
            flipped: string;
            designThinking: string;
            gamification: string;
            dua: string;
          };
          descriptions: {
            lecture: string;
            activeLearning: string;
            practicalLearning: string;
            socialEmotionalLearning: string;
            caseBased: string;
            inquiryBased: string;
            researchBased: string;
            problemBased: string;
            projectBased: string;
            challengeBased: string;
            collaborative: string;
            flipped: string;
            designThinking: string;
            gamification: string;
            dua: string;
          }
        },
        isPublic: {
          label: string;
          tooltip: string;
          description: string;
        };
      };
      buttons: {
        generating: string;
        generate: string;
        preview: string;
      };
    };
    preview: {
      title: string;
    };
    previewButtons: {
      close: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    sidebar: {
      title: "Menu",
      searchPlaceholder: "Search...",
      menu: "Menu",
      classPlanner: "Class Planner",
      aiTools: "AI Tools",
      history: "History",
      readyMaterials: "Ready Materials",
      ranking: "Ranking",
      calendar: "Calendar",
      shareWhatsApp: "Share on WhatsApp",
      hideMenu: "Hide Menu",
      logout: "Logout",
      logoutSuccess: "Logged out successfully",
      logoutError: "Error logging out"
    },
    feedback: {
      title: 'How was your experience with the planning?',
      description: 'Your feedback is important to improve the service. Please share your opinion.',
      positive: 'Positive',
      negative: 'Negative',
      comment: 'Comment (optional)',
      commentPlaceholder: 'Do you have any comments or suggestions to help us improve?',
      send: 'Send Feedback',
      success: 'Feedback sent successfully',
      error: 'Error sending feedback',
      required: 'Please send your feedback before continuing'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      back: 'Back',
      exportExcel: 'Export to Excel',
      exportWord: 'Export to Word',
      viewDetails: 'View Details',
      close: 'Close',
      cancel: 'Cancel',
      generate: 'Generate',
      generating: 'Generating...'
    },
    unitPlanner: {
      newTool: "New Tool",
      title: "ProfePlanner Class Planner",
      subtitle: "Create effective and personalized lesson plans for your students with artificial intelligence",
      startPlanning: "Start Planning",
      startPlanningSubtitle: "Create your first class in minutes",
      letsStart: "Let's Start",
      classHistory: "Class History",
      calendar: {
        title: "Calendar"
      },
      features: {
        intelligentPlanning: {
          title: "Intelligent Planning",
          description: "Design classes adapted to your learning objectives and educational level."
        },
        clearObjectives: {
          title: "Clear Objectives",
          description: "Define specific learning standards and objectives for each class."
        },
        efficientOrganization: {
          title: "Efficient Organization",
          description: "Plan multiple lessons and maintain an organized record of your classes."
        }
      },
      steps: {
        basicInfo: {
          title: "Basic Information",
          subtitle: "Start by giving your class a name, Educational Level and Subject",
          className: "Class Name or Topic",
          classNamePlaceholder: "e.g. English Verb Tenses",
          educationalLevel: "Educational Level",
          educationalLevelPlaceholder: "Select academic grade",
          subject: "Subject",
          subjectPlaceholder: "Select subject",
          back: "Back",
          next: "Next"
        },
        classDetails: {
          title: "Class Details",
          subtitle: "Provide detailed information for planning",
          methodology: "Class Methodology (Optional)",
          methodologyPlaceholder: "Choose methodology",
          classContent: "This Class Should Cover",
          classContentPlaceholder: "e.g. grammatical tenses",
          standards: "Standards / Objectives",
          standardsPlaceholder: "e.g. step by step",
          suggestions: "Suggestions",
          back: "Back",
          next: "Final Step"
        },
        duration: {
          title: "Class Duration",
          subtitle: "Define how many lessons your plan will include",
          classLength: "Class Length",
          lessons: "lessons",
          back: "Back",
          viewDetails: "View Details",
          processing: "Processing..."
        }
      },
      validation: {
        classNameRequired: "Class name is required",
        subjectRequired: "Subject is required",
        classContentRequired: "Class details are required",
        standardsRequired: "Standards and objectives are required",
        pleaseCompleteFields: "Please complete all required fields"
      },
      history: {
        title: "Class History",
        subtitle: "Manage and view your planned classes",
        backToPlanner: "Back to Class Planner",
        generateQuestions: "Generate Saber Pro Questions (Evaluate by Topics)",
        generateQuestionsSubtitle: "Select multiple units to generate combined questions",
        selectMultipleUnits: "Select multiple units to generate combined questions",
        generateCombinedQuestions: "Generate combined questions",
        generateCombinedQuestionsDescription: "Select several units by checking the boxes and generate questions that evaluate multiple topics at once. You can customize the question type, quantity, and difficulty level.",
        educationalLevel: "Educational Level",
        allLevels: "All levels",
        subject: "Subject",
        allSubjects: "All subjects",
        searchPlaceholder: "Search by class name or details...",
        selectAll: "Select All",
        deselectAll: "Deselect All",
        lessons: "Lessons",
        lesson: "Lesson",
        viewDetails: "View Details",
        deletePlan: "Delete Plan",
        deleteConfirmation: "Delete Plan",
        deleteConfirmationDescription: "Are you sure you want to delete this plan? This action cannot be undone and will permanently delete all associated data.",
        cancel: "Cancel",
        delete: "Delete",
        generateQuestionsDialog: {
          title: "Generate Evaluation Questions",
          description: "Configure the questions you want to generate based on the selected units.",
          selectedUnits: "Selected Units",
          questionType: "Question Type",
          questionTypePlaceholder: "Select the question type",
          numberOfQuestions: "Number of Questions",
          numberOfQuestionsPlaceholder: "Select the number of questions",
          difficultyLevel: "Difficulty Level",
          difficultyLevelPlaceholder: "Select the difficulty level",
          generating: "Generating...",
          generate: "Generate Questions"
        },
        questionTypes: {
          multipleChoice: "Multiple Choice",
          fillInTheBlank: "Fill in the Blank",
          trueFalse: "True or False",
          writtenResponse: "Written Response",
          multipleChoiceAndFillInTheBlank: "Multiple Choice and Fill in the Blank",
          multipleChoiceAndTrueFalse: "Multiple Choice and True or False",
          multipleChoiceAndWrittenResponse: "Multiple Choice and Written Response"
        },
        difficultyLevels: {
          low: "Low",
          medium: "Medium",
          high: "High"
        },
        noResults: "No results found for your search",
        noActiveClasses: "No active classes in history.",
        earlyChildhoodEducation: "Early Childhood Education",
        university: "University",
        grade: "Grade"
      },
      view: {
        backToPlanner: 'Back to Planner',
        status: {
          active: 'Active'
        },
        sections: {
          unitDetails: 'Unit Details',
          standardsAndObjectives: 'Standards and Objectives',
          lessonPlan: 'Lesson Plan'
        },
        buttons: {
          viewDetails: 'View Details',
          exportToExcel: 'Export to Excel',
          exportToWord: 'Export to Word'
        },
        dialogs: {
          lessonDetails: {
            title: 'Lesson {day}',
            close: 'Close',
            sections: {
              start: 'Start',
              development: 'Development',
              closure: 'Closure',
              activities: 'Activities',
              resources: 'Resources',
              achievements: 'Achievements',
              evidence: 'Evidence',
              evidenceFields: {
                saber: 'Know',
                saberHacer: 'Know How',
                ser: 'Be'
              }
            },
            help: {
              title: '¿Necesitas ayuda?',
              description: 'Esta sección te muestra los detalles de la lección. Puedes navegar entre las diferentes secciones usando los botones de arriba.'
            },
            summary: 'Resumen',
            mainTopic: 'Tema Principal',
            date: 'Fecha',
            estimatedDuration: 'Duración Estimada',
            minutes: 'minutos',
            status: 'Estado',
            completed: 'Completado',
            nextLesson: 'Siguiente Lección'
          },
          generateQuestionnaire: {
            title: 'Generate Questionnaire',
            description: 'Generate a questionnaire based on the lesson content.',
            questionType: 'Question Type',
            selectQuestionType: 'Select question type',
            multipleChoice: 'Multiple Choice',
            fillInTheBlank: 'Fill in the Blank',
            trueFalse: 'True/False',
            writtenResponse: 'Written Response',
            multipleChoiceAndFillInTheBlank: 'Multiple Choice and Fill in the Blank',
            multipleChoiceAndTrueFalse: 'Multiple Choice and True/False',
            multipleChoiceAndWrittenResponse: 'Multiple Choice and Written Response',
            questionCount: 'Number of Questions',
            selectQuestionCount: 'Select number of questions',
            questions: 'questions',
            difficulty: 'Difficulty',
            selectDifficulty: 'Select difficulty',
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            cancel: 'Cancel',
            generate: 'Generate',
            generating: 'Generating...',
            success: 'Questionnaire generated successfully',
            error: 'Error generating questionnaire',
            pleaseLogin: 'Please log in to generate the questionnaire',
            questionTypes: {
              multipleChoice: "Multiple Choice",
              fillInTheBlank: "Fill in the Blank",
              trueFalse: "True/False",
              writtenResponse: "Written Response",
              multipleChoiceAndFillInTheBlank: "Multiple Choice & Fill in the Blank",
              multipleChoiceAndTrueFalse: "Multiple Choice & True/False",
              multipleChoiceAndWrittenResponse: "Multiple Choice & Written Response"
            },
            difficultyLevels: {
              low: "Low",
              medium: "Medium",
              high: "High"
            }
          },
          generateWordSearch: {
            generate: 'Generate Word Search',
            generating: 'Generating...',
            success: 'Word search generated successfully',
            error: 'Error generating word search'
          }
        }
      }
    },
    workshop: {
      title: "Workshop",
      subtitle: "Create and customize your educational resources",
      suggestNewTool: "Suggest a new tool",
      editAndCustomize: "Edit and customize your content",
      exportToPDF: "Export to PDF",
      exportToWord: "Export to Word",
      shareContent: "Share content",
      saveChanges: "Save changes",
      workingDocument: "Working document",
      wordsToFind: "Words to find!",
      bold: "Bold",
      italic: "Italic",
      bulletList: "Bullet list",
      numberedList: "Numbered list",
      undo: "Undo",
      categories: {
        all: "All",
        favorites: "Favorites",
        planning: "Planning",
        assessment: "Assessment",
        content: "Content",
        communication: "Communication",
        createTool: "Create Tool"
      },
      tools: {
        dua: {
          title: "Diseño Universal para el Aprendizaje (DUA)",
          description: "Crea diseños universales para el aprendizaje que se adapten a las necesidades de todos los estudiantes"
        },
        quizCreator: {
          title: "Quiz Creator",
          description: "Create a quiz in minutes with the help of ProfePlanner. This tool is excellent for creating formative assessments."
        },
        lessonPlanner: {
          title: "Lesson Planner",
          description: "Save time and energy by creating a detailed lesson plan with the help of ProfePlanner. Never stare at a blank page again."
        },
        educationalMaterial: {
          title: "Educational Material Ideas",
          description: "Create detailed and structured material to prepare yourself or your students for a lesson."
        },
        ideaGenerator: {
          title: "Idea Generator",
          description: "Generate a list of ideas for a lesson, project, or anything else you can imagine. This tool is excellent for brainstorming activities!"
        },
        reasonableAdjustments: {
          title: "Inclusion Support Plan (PIAR)",
          description: "Generate personalized reasonable adjustments for students with specific needs, including identified barriers, types of adjustments, and follow-up plan."
        },
        slides: {
          title: "Slide Generator",
          description: "Create professional presentations with automatically generated content, color customization, and image support."
        },
        wordSearch: {
          title: "Word Search",
          description: "Create interactive and educational word searches for your students."
        },
        freeAI: {
          title: "Free AI",
          description: "Tell ProfePlanner what to do, without restrictions, format, or barriers."
        },
        realWorldBenefits: {
          title: "Real World Achievements",
          description: "Generate a list of real-world achievements for a topic. This tool is excellent for helping students understand the importance of a topic."
        },
        projectGenerator: {
          title: "Project Generator",
          description: "Generate a project for any unit or topic. This tool is perfect for creating fun, engaging, and educational projects for students."
        },
        studentReports: {
          title: "Student Reports",
          description: "Generate a report for a student. This tool is excellent for helping students understand their strengths and weaknesses."
        },
        commemorativeDates: {
          title: "Commemorative Dates",
          description: "Generate ideas for educational activities related to important dates in Colombia."
        },
        grammarChecker: {
          title: "Grammar Checker",
          description: "Correct and improve the grammar of your texts automatically."
        },
        topicSummary: {
          title: "Topic Summary",
          description: "Generate concise and clear summaries of any topic you need."
        },
        crossword: {
          title: "Crossword",
          description: "Generate personalized crosswords to reinforce your students' learning."
        },
        mindMap: {
          title: "Mind Map",
          description: "Create visual mind maps to organize ideas and concepts."
        },
        timeline: {
          title: "Línea de Tiempo",
          description: "Generate educational timelines to visualize events and processes."
        },
        conceptMap: {
          title: "Concept Map",
          description: "Create a concept map to visualize the relationships between concepts."
        },
        questionWheel: {
          title: "Question Wheel",
          description: "Generate an interactive wheel with questions to make learning more dynamic."
        },
        parentWorkshops: {
          title: "Parent Workshops",
          description: "Generate ideas for educational workshops aimed at parents, focused on supporting their children's learning."
        },
        teacherTraining: {
          title: "Teacher Training",
          description: "Generate a training plan for teachers on the use of technological tools in education."
        },
        qualityStandards: {
          title: "Quality Standards",
          description: "Generate a document with quality standards in education for an educational institution."
        },
        activityIdeas: {
          title: "Activity Ideas",
          description: "Generate a list of ideas for interactive and didactic activities on any topic."
        },
        didacticSequence: {
          title: "Didactic Sequence",
          description: "Create a detailed didactic sequence including activities, resources, and evaluation."
        },
        writing: {
          title: "Writing and Composition",
          description: "Get suggestions to improve your students' writing and composition."
        },
        textQuestions: {
          title: "Text Questions",
          description: "Generate reading comprehension questions for any text."
        },
        recoveryPlan: {
          title: "Recovery Plan",
          description: "Create learning recovery plans for students who need additional support."
        },
        questionCorrection: {
          title: "Question Correction",
          description: "Review and correct assessment questions to ensure their quality and clarity."
        },
        essayGrader: {
          title: "Essay Grader",
          description: "Generate detailed evaluation criteria for grading essays."
        },
        textLeveling: {
          title: "Text Leveling",
          description: "Adapt texts to different levels of reading comprehension."
        },
        textAccessibility: {
          title: "Text Accessibility",
          description: "Get recommendations to make texts accessible for all students."
        },
        checklist: {
          title: "Checklist",
          description: "Generate a checklist to help students organize their learning."
        },
        learningObjectives: {
          title: "Learning Objectives",
          description: "Generate clear and measurable learning objectives for any topic."
        },
        schoolEmails: {
          title: "School Emails",
          description: "Create professional school emails to communicate with parents and students."
        },
        parentEmails: {
          title: "Parent Emails",
          description: "Create professional emails to communicate with parents and students."
        },
        clearInstructions: {
          title: "Clear Instructions",
          description: "Generate clear and easy-to-follow instructions for any activity."
        },
        paperTestCorrection: {
          title: "Paper Test Corrector",
          description: "Scan and automatically grade handwritten tests using intelligent text recognition."
        },
        videoQuestions: {
          title: "YouTube Video Questions",
          description: "Generate comprehension and analysis questions from YouTube videos to assess your students' learning."
        },
        steam: {
          title: "Generador de Plan STEAM",
          description: "Crea planes STEAM integrando ciencias, tecnología, ingeniería, artes y matemáticas con enfoque interdisciplinario y resolución de problemas."
        },
        rubric: {
          title: "Generador de Rúbricas",
          description: "Crea rúbricas detalladas para evaluar el trabajo de los estudiantes en cualquier tema o proyecto."
        },
        imageSearch: {
          title: "Image Search",
          description: "Search for relevant images for your lessons in seconds."
        }
      }
    },
    history: {
      title: "My Teaching Library",
      subtitle: "Explore and manage your collection of educational resources created with artificial intelligence",
      loading: "Loading workshops...",
      error: {
        noEmail: "No email found in local storage",
        fetchError: "Error fetching workshops: {status}",
        loadingError: "Error loading workshops"
      },
      selectCategory: "Select a category",
      organizeMaterial: "Organize and access all your educational material",
      educationalResources: "Educational Resources",
      resources: "resources",
      resource: "resource",
      searchResources: "Search resources...",
      newResource: "New Resource",
      viewResource: "View resource",
      noResourcesFound: "No resources found",
      noResourcesInCategory: "No resources in this category",
      createNewResource: "Create new resource",
      deleteResource: "Delete resource",
      deleteResources: "Delete resources",
      deleteConfirmation: "Are you sure?",
      deleteConfirmationDescription: "This action will permanently delete {count} {resource}. This action cannot be undone.",
      cancel: "Cancel",
      delete: "Delete",
      createResource: "Create Resource",
      sure: "Are you sure?",
      actionCannotBeUndone: "This action cannot be undone.",
      tools: {
        "crear-cuestionario": {
          title: "Quiz Creator",
          description: "Create a quiz in minutes with ProfePlanner's help. This tool is excellent for creating formative assessments."
        },
        "rubrica-evaluacion": {
          title: "Rubric Generator",
          description: "Create detailed rubrics for evaluating student work on any topic."
        },
        "sopa-de-letras": {
          title: "Word Search",
          description: "Create educational word searches to reinforce vocabulary and key concepts learning."
        },
        "crear-plan-de-leccion": {
          title: "Lesson Planner",
          description: "Save time and energy creating a detailed lesson plan with ProfePlanner's help."
        },
        "crear-material-educativo": {
          title: "Educational Material",
          description: "Generate customized educational material for your classes."
        },
        "generar-ideas": {
          title: "Idea Generator",
          description: "Generate creative ideas for your educational activities."
        },
        "ia-libre": {
          title: "Free AI",
          description: "Use AI without restrictions for your educational needs."
        },
        "beneficios-del-mundo-real": {
          title: "Real World Benefits",
          description: "Explore the benefits and practical applications of educational topics."
        },
        "generar-proyecto": {
          title: "Project Generator",
          description: "Crea proyectos educativos completos y atractivos."
        },
        "generar-informe-estudiantil": {
          title: "Student Reports",
          description: "Crea informes detallados sobre el progreso de los estudiantes."
        },
        "generar-correo-para-padres": {
          title: "Parent Emails",
          description: "Genera comunicaciones efectivas para los padres."
        },
        "ideas-fechas-conmemorativas": {
          title: "Commemorative Dates",
          description: "Encuentra ideas para celebrar fechas importantes."
        },
        "corrector-gramatical": {
          title: "Grammar Checker",
          description: "Corrige y mejora textos educativos."
        },
        "resumen-tema": {
          title: "Resumen de Tema",
          description: "Genera resúmenes concisos de temas educativos."
        },
        "talleres-de-padres": {
          title: "Talleres de Padres",
          description: "Crea talleres educativos para padres."
        },
        "capacitacion-docentes": {
          title: "Capacitación Docentes",
          description: "Genera planes de capacitación para docentes."
        },
        "estandares-calidad-educacion": {
          title: "Estándares de Calidad",
          description: "Define estándares de calidad educativa."
        },
        "generar-ideas-actividades": {
          title: "Ideas de Actividades",
          description: "Genera ideas para actividades educativas."
        },
        "generar-secuencia-didactica": {
          title: "Secuencia Didáctica",
          description: "Crea secuencias didácticas completas."
        },
        "generar-redaccion": {
          title: "Redacción",
          description: "Genera ejercicios de redacción."
        },
        "generar-preguntas-texto": {
          title: "Preguntas sobre Texto",
          description: "Genera preguntas de comprensión lectora."
        },
        "generar-plan-recuperacion": {
          title: "Plan de Recuperación",
          description: "Crea planes de recuperación académica."
        },
        "correccion-preguntas": {
          title: "Corrección de Preguntas",
          description: "Corrige y mejora preguntas de evaluación."
        },
        "calificador-ensayos": {
          title: "Calificador de Ensayos",
          description: "Evalúa y califica ensayos estudiantiles."
        },
        "nivelacion-textos": {
          title: "Nivelación de Textos",
          description: "Adapta textos a diferentes niveles educativos."
        },
        "accesibilidad-textos": {
          title: "Accesibilidad de Textos",
          description: "Hace los textos más accesibles para todos."
        },
        "generar-objetivos-aprendizaje": {
          title: "Objetivos de Aprendizaje",
          description: "Define objetivos de aprendizaje claros."
        },
        "generar-correo-escolar": {
          title: "Correos Escolares",
          description: "Genera comunicaciones escolares efectivas."
        },
        "generar-instrucciones-claras": {
          title: "Instrucciones Claras",
          description: "Crea instrucciones claras para actividades."
        },
        "crear-cuestionario-video-youtube": {
          title: "Preguntas de Video de YouTube",
          description: "Genera preguntas de comprensión y análisis a partir de videos de YouTube para evaluar el aprendizaje de tus estudiantes."
        }
      }
    },
    community: {
      searchPlaceholder: "Search by topics, materials, etc.",
      searchResults: "results",
      subscribePremium: "Subscribe to Premium!",
      notifications: "Notifications",
      points: "points",
      medals: "medals",
      feed: "Feed",
      readyMaterials: "Ready Materials",
      readyMaterialsTitle: "✨ Ready Materials",
      readyMaterialsDescription: "Discover and share innovative educational resources for your classroom.",
      communitySearch: "Search in the community...",
      userProfile: {
        inviteFriends: "Invite friends",
        english: "English"
      },
      post: {
        placeholder: "Ask or share in the community",
        forYou: "For you",
        like: "Like",
        comments: "comments",
        reply: "Reply"
      },
      collaborators: {
        title: "Most Collaborative",
        masterAI: "AI Master"
      },
      inicio: {
        title: "✨ Ready Materials",
        subtitle: "Discover and share innovative educational resources for your classroom.",
        discover: "Discover and share",
        materials: "Materials",
        ideas: "Ideas",
        inspiration: "Inspiración",
        searchPlaceholder: "Search shared resources...",
        filterPlaceholder: "Filter by type",
        allTypes: "All types",
        loading: "Loading shared resources...",
        viewResource: "View resource",
        email: "Email",
        types: {
          "planificador-de-clases": "Planificador de Clases",
          "herramientas-ia": "Herramientas de IA",
          "historial": "Historial",
          "materiales-listos": "Materiales listos",
          "ranking": "Ranking",
          "crear-material-educativo": "Crear Material Educativo",
          "generar-ideas": "Generar Ideas",
          "ajustes-razonables": "Ajustes Razonables (PIAR)",
          "diapositivas-automaticas": "Diapositivas Automáticas",
          "sopa-de-letras": "Sopa de Letras",
          "ia-libre": "IA Libre",
          "beneficios-mundo-real": "Beneficios del Mundo Real",
          "generar-proyecto": "Generar Proyecto",
          "generar-informe-estudiantil": "Generar Informe Estudiantil",
          "ideas-fechas-conmemorativas": "Ideas de Fechas Conmemorativas",
          "corrector-gramatical": "Corrector Gramatical",
          "resumen-tema": "Resumen de Tema",
          "crucigrama": "Crucigrama",
          "mapa-mental-flow": "Mapa Mental",
          "mapa-conceptual": "Mapa Conceptual",
          "ruleta-preguntas": "Ruleta de Preguntas",
          "talleres-padres": "Talleres para Padres",
          "capacitacion-docente": "Capacitación Docente",
          "estandares-calidad": "Estándares de Calidad",
          "generar-ideas-actividades": "Generar Ideas de Actividades",
          "secuencia-didactica": "Secuencia Didáctica",
          "escritura": "Escritura",
          "preguntas-texto": "Preguntas de Texto",
          "plan-recuperacion": "Plan de Recuperación",
          "correccion-preguntas": "Corrección de Preguntas",
          "calificador-ensayos": "Calificador de Ensayos",
          "nivelacion-textos": "Nivelación de Texto",
          "accesibilidad-textos": "Accesibilidad de Texto",
          "objetivos-aprendizaje": "Objetivos de Aprendizaje",
          "correos-escolares": "Correos Escolares",
          "correos-padres": "Correos para Padres",
          "instrucciones-claras": "Instrucciones Claras",
          "correccion-pruebas-papel": "Corrección de Pruebas en Papel",
          "preguntas-video": "Preguntas de Video",
          "generar-instrucciones": "Generar Instrucciones",
          "crear-plan-de-leccion": "Crear Plan de Lección",
          "generar-plan-recuperacion": "Generar Plan de Recuperación",
          "generar-preguntas-texto": "Generar Preguntas de Texto",
          "crear-cuestionario": "Crear Cuestionario",
          "generar-secuencia-didactica": "Generar Secuencia Didáctica",
          "generar-instrucciones-claras": "Generar Instrucciones Claras"
        }
      }
    },
    ranking: {
      title: "Teacher Ranking",
      subtitle: "We recognize your dedication and effort",
      promotion: {
        title: "Win Prizes by Completing Classes in November! 🎉",
        description: "Earn points by creating quizzes and completing activities. Stay active and climb the ranking to win medals and special prizes! 🎁",
        callToAction: "Participate and show your dedication! 🚀"
      }
    },
    lessonPlanner: {
      title: "Lesson Planner",
      buttons: {
        exportToPDF: "Export to PDF",
        exportToWord: "Export to Word",
        share: "Share"
      },
      editor: {
        paragraph: "Paragraph",
        heading1: "Heading 1",
        heading2: "Heading 2",
        heading3: "Heading 3"
      },
      messages: {
        generating: "Generating lesson plan...",
        typing: "Typing...",
        noLessonPlan: "No lesson plan generated yet",
        completeForm: "Complete the form to generate your lesson plan"
      },
      form: {
        title: "Lesson Plan Form",
        help: {
          title: "Help",
          learningObjectives: {
            title: "Learning Objectives",
            tip1: "Be specific and measurable",
            tip2: "Align with curriculum standards",
            tip3: "Consider different learning styles"
          },
          duration: {
            title: "Duration",
            tip1: "Consider class length",
            tip2: "Include time for activities",
            tip3: "Plan for transitions"
          }
        },
        fields: {
          name: {
            label: "Lesson Name",
            tooltip: "Enter a descriptive name for your lesson",
            placeholder: "e.g., Introduction to Fractions"
          },
          topic: {
            label: "Topic",
            tooltip: "What will this lesson cover?",
            placeholder: "e.g., Basic Fractions"
          },
          grade: {
            label: "Grade Level",
            tooltip: "Select the appropriate grade level",
            placeholder: "Select grade level",
            options: {
              preschool: "Preschool",
              grade1: "Grade 1",
              grade2: "Grade 2",
              grade3: "Grade 3",
              grade4: "Grade 4",
              grade5: "Grade 5",
              grade6: "Grade 6",
              grade7: "Grade 7",
              grade8: "Grade 8",
              grade9: "Grade 9",
              grade10: "Grade 10",
              grade11: "Grade 11",
              university: "University"
            }
          },
          subject: {
            label: "Subject",
            tooltip: "Select the subject area",
            placeholder: "Select subject",
            options: {
              biology: "Biology",
              naturalSciences: "Natural Sciences",
              socialSciences: "Social Sciences",
              economics: "Economics",
              artEducation: "Art Education",
              physicalEducation: "Physical Education",
              physics: "Physics",
              geography: "Geography",
              history: "History",
              english: "English",
              mathematics: "Mathematics",
              chemistry: "Chemistry",
              language: "Language",
              literature: "Literature",
              religion: "Religion",
              politicalConstitution: "Political Constitution",
              ethics: "Ethics",
              philosophy: "Philosophy",
              informationTechnology: "Information Technology",
              environmentalEducation: "Environmental Education",
              afroColombianStudies: "Afro-Colombian Studies",
              citizenshipEducation: "Citizenship Education",
              peaceEducation: "Peace Education",
              sexualityEducation: "Sexuality Education",
              other: "Other"
            },
            customPlaceholder: "Enter custom subject"
          },
          duration: {
            label: "Duration",
            tooltip: "How long will this lesson take?",
            placeholder: "Select duration",
            minutes: "minutes"
          },
          objectives: {
            label: "Learning Objectives",
            tooltip: "What will students learn?",
            placeholder: "Enter learning objectives"
          },
          methodology: {
            label: "Teaching Methodology",
            tooltip: "Select the teaching approach",
            placeholder: "Select methodology",
            options: {
              lecture: "Lecture",
              activeLearning: "Active Learning",
              practicalLearning: "Practical Learning",
              socialEmotionalLearning: "Social and Emotional Learning",
              caseBased: "Case-Based Learning",
              inquiryBased: "Inquiry-Based Learning",
              researchBased: "Research-Based Learning",
              problemBased: "Problem-Based Learning",
              projectBased: "Project-Based Learning",
              challengeBased: "Challenge-Based Learning",
              collaborative: "Collaborative Learning",
              flipped: "Flipped Learning",
              designThinking: "Design Thinking",
              gamification: "Gamification",
              dua: "Universal Design for Learning"
            },
            descriptions: {
              lecture: "The teacher presents content directly while students assimilate and take notes.",
              activeLearning: "Students actively participate through practical activities and collaborative projects.",
              practicalLearning: "Shows how content applies to real professions, preparing them for market challenges.",
              socialEmotionalLearning: "Combines academic content with socio-emotional skills like empathy and teamwork.",
              caseBased: "Students analyze real or simulated situations to apply knowledge",
              inquiryBased: "Fosters curiosity, starting from student questions to investigate",
              researchBased: "Students scientifically investigate to solve complex questions",
              problemBased: "Solve real or simulated problems to develop analysis skills",
              projectBased: "Students create a final product by applying knowledge during the process",
              challengeBased: "Face real challenges that require creative and innovative solutions",
              collaborative: "Promotes teamwork to achieve common goals through cooperation",
              flipped: "Students review theory at home and apply it in class through guided practices",
              designThinking: "User-centered methodology to design creative solutions to complex problems",
              gamification: "Applies game elements to motivate and make the learning process more attractive",
              dua: "Provides multiple ways of learning, engaging, and expressing knowledge"
            }
          },
          isPublic: {
            label: "Make Public",
            tooltip: "Share this lesson plan with other teachers",
            description: "Make this lesson plan visible to other teachers"
          }
        },
        buttons: {
          generating: "Generating...",
          generate: "Generate Lesson Plan",
          preview: "Preview"
        }
      },
      preview: {
        title: "Lesson Plan Preview"
      },
      previewButtons: {
        close: "Close"
      }
    }
  },
  es: {
    sidebar: {
      title: "Menú",
      searchPlaceholder: "Buscar...",
      menu: "Menú",
      classPlanner: "Planificador de Clase",
      aiTools: "Herramientas de IA",
      history: "Historial",
      readyMaterials: "Materiales listos",
      ranking: "Ranking",
      calendar: "Mis clases",
      shareWhatsApp: "Compartir por WhatsApp",
      hideMenu: "Ocultar menú",
      logout: "Cerrar sesión",
      logoutSuccess: "Sesión cerrada exitosamente",
      logoutError: "Error al cerrar sesión"
    },
    feedback: {
      title: '¿Cómo fue tu experiencia con la planeación?',
      description: 'Tu feedback es importante para mejorar el servicio. Por favor, comparte tu opinión.',
      positive: 'Positivo',
      negative: 'Negativo',
      comment: 'Comentario (opcional)',
      commentPlaceholder: '¿Tienes algún comentario o sugerencia que nos ayude a mejorar?',
      send: 'Enviar Feedback',
      success: 'Feedback enviado exitosamente',
      error: 'Error al enviar el feedback',
      required: 'Por favor, envía tu feedback antes de continuar',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      back: 'Volver',
      exportExcel: 'Exportar a Excel',
      exportWord: 'Exportar a Word',
      viewDetails: 'Ver Detalles',
      close: 'Cerrar',
      cancel: 'Cancelar',
      generate: 'Generar',
      generating: 'Generando...',
    },
    unitPlanner: {
      newTool: "Nueva Herramienta",
      title: "Planificador de Clase ProfePlanner",
      subtitle: "Crea planes de clase efectivos y personalizados para tus estudiantes con inteligencia artificial",
      startPlanning: "Comienza a Planificar",
      startPlanningSubtitle: "Crea tu primera clase en minutos",
      letsStart: "Comencemos",
      classHistory: "Historial de Clases",
      calendar: {
        title: "Mis clases"
      },
      features: {
        intelligentPlanning: {
          title: "Planificación Inteligente",
          description: "Diseña clases adaptadas a tus objetivos de aprendizaje y nivel educativo."
        },
        clearObjectives: {
          title: "Objetivos Claros",
          description: "Define estándares y objetivos de aprendizaje específicos para cada clase."
        },
        efficientOrganization: {
          title: "Organización Eficiente",
          description: "Planifica múltiples lecciones y mantén un registro organizado de tus clases."
        }
      },
      steps: {
        basicInfo: {
          title: "Información Básica",
          subtitle: "Comienza dando un nombre a tu clase, Nivel Educativo y Materia",
          className: "Nombre De La Clase o Tema",
          classNamePlaceholder: "ej. Tiempos Verbales en Inglés",
          educationalLevel: "Nivel Educativo",
          educationalLevelPlaceholder: "Selecciona el grado académico",
          subject: "Materia",
          subjectPlaceholder: "Selecciona la materia",
          back: "Atrás",
          next: "Siguiente"
        },
        classDetails: {
          title: "Detalles de la Clase",
          subtitle: "Proporciona información detallada para la planificación",
          methodology: "Metodología de la clase (Opcional)",
          methodologyPlaceholder: "Elige la metodología",
          classContent: "Esta Clase Debe Cubrir",
          classContentPlaceholder: "ej. tiempos gramaticales",
          standards: "Estándares / Objetivos",
          standardsPlaceholder: "ej. el paso a paso",
          suggestions: "Sugerencias",
          back: "Atrás",
          next: "Siguiente"
        },
        duration: {
          title: "Duración de la Clase",
          subtitle: "Define cuántas lecciones incluirá tu plan",
          classLength: "Longitud De La Clase",
          lessons: "lecciones",
          back: "Atrás",
          viewDetails: "Ver Detalles",
          processing: "Procesando..."
        }
      },
      validation: {
        classNameRequired: "El nombre de la unidad es requerido",
        subjectRequired: "La asignatura es requerida",
        classContentRequired: "Los detalles de la unidad son requeridos",
        standardsRequired: "Los estándares y objetivos son requeridos",
        pleaseCompleteFields: "Por favor, complete todos los campos requeridos"
      },
      history: {
        title: "Historial de Clases",
        subtitle: "Gestiona y visualiza tus clases planificadas",
        backToPlanner: "Volver al Planificador de clases",
        generateQuestions: "Generar Preguntas Saber Pro(Evalúa por Temas)",
        generateQuestionsSubtitle: "Selecciona múltiples unidades para generar preguntas combinadas",
        selectMultipleUnits: "Selecciona múltiples unidades para generar preguntas combinadas",
        generateCombinedQuestions: "Genera preguntas combinadas",
        generateCombinedQuestionsDescription: "Selecciona varias unidades marcando las casillas y genera preguntas que evalúen múltiples temas a la vez. Puedes personalizar el tipo de preguntas, cantidad y nivel de dificultad.",
        educationalLevel: "Educational Level",
        allLevels: "Todos los niveles",
        subject: "Materia",
        allSubjects: "Todas las materias",
        searchPlaceholder: "Buscar por nombre o detalles de la clase...",
        selectAll: "Seleccionar Todo",
        deselectAll: "Deseleccionar Todo",
        lessons: "Lecciones",
        lesson: "Lección",
        viewDetails: "Ver Detalles",
        deletePlan: "Eliminar Plan",
        deleteConfirmation: "Eliminar Plan",
        deleteConfirmationDescription: "¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer y eliminará permanentemente todos los datos asociados.",
        cancel: "Cancelar",
        delete: "Eliminar",
        generateQuestionsDialog: {
          title: "Generar Preguntas de Evaluación",
          description: "Configura las preguntas que deseas generar basadas en las unidades seleccionadas.",
          selectedUnits: "Unidades Seleccionadas",
          questionType: "Tipo de Pregunta",
          questionTypePlaceholder: "Selecciona el tipo de pregunta",
          numberOfQuestions: "Número de Preguntas",
          numberOfQuestionsPlaceholder: "Selecciona la cantidad de preguntas",
          difficultyLevel: "Nivel de Dificultad",
          difficultyLevelPlaceholder: "Selecciona el nivel de dificultad",
          generating: "Generando...",
          generate: "Generar Preguntas"
        },
        questionTypes: {
          multipleChoice: "Opción Múltiple",
          fillInTheBlank: "Completar el Espacio",
          trueFalse: "Verdadero o Falso",
          writtenResponse: "Respuesta Escrita",
          multipleChoiceAndFillInTheBlank: "Opción Múltiple & Completar el Espacio",
          multipleChoiceAndTrueFalse: "Opción Múltiple & Verdadero o Falso",
          multipleChoiceAndWrittenResponse: "Opción Múltiple & Respuesta Escrita"
        },
        difficultyLevels: {
          low: "Baja",
          medium: "Media",
          high: "Alta"
        },
        noResults: "No se encontraron resultados para tu búsqueda",
        noActiveClasses: "No hay clases activas en el historial.",
        earlyChildhoodEducation: "Educación Infantil",
        university: "Universidad",
        grade: "Grado"
      },
      view: {
        backToPlanner: 'Volver al Planificador',
        status: {
          active: 'Activo'
        },
        sections: {
          unitDetails: 'Detalles de las Clases',
          standardsAndObjectives: 'Estándares y Objetivos',
          lessonPlan: 'Plan de Clases'
        },
        buttons: {
          viewDetails: 'Ver Detalles',
          exportToExcel: 'Exportar a Excel',
          exportToWord: 'Exportar a Word'
        },
        dialogs: {
          lessonDetails: {
            title: 'Lección {day}',
            close: 'Cerrar',
            sections: {
              start: 'Inicio',
              development: 'Desarrollo',
              closure: 'Cierre',
              activities: 'Actividades',
              resources: 'Recursos',
              achievements: 'Logros',
              evidence: 'Evidencia',
              evidenceFields: {
                saber: 'Saber',
                saberHacer: 'Saber Hacer',
                ser: 'Ser'
              }
            },
            help: {
              title: '¿Necesitas ayuda?',
              description: 'Esta sección te muestra los detalles de la lección. Puedes navegar entre las diferentes secciones usando los botones de arriba.'
            },
            summary: 'Resumen',
            mainTopic: 'Tema Principal',
            date: 'Fecha',
            estimatedDuration: 'Duración Estimada',
            minutes: 'minutos',
            status: 'Estado',
            completed: 'Completado',
            nextLesson: 'Siguiente Lección'
          },
          generateQuestionnaire: {
            title: 'Generar Cuestionario',
            description: 'Genera un cuestionario basado en el contenido de la lección.',
            questionType: 'Tipo de Preguntas',
            selectQuestionType: 'Selecciona el tipo de preguntas',
            multipleChoice: 'Opción Múltiple',
            fillInTheBlank: 'Completar Espacios en Blanco',
            trueFalse: 'Verdadero/Falso',
            writtenResponse: 'Respuesta Escrita',
            multipleChoiceAndFillInTheBlank: 'Opción Múltiple y Completar Espacios',
            multipleChoiceAndTrueFalse: 'Opción Múltiple y Verdadero/Falso',
            multipleChoiceAndWrittenResponse: 'Opción Múltiple y Respuesta Escrita',
            questionCount: 'Número de Preguntas',
            selectQuestionCount: 'Selecciona el número de preguntas',
            questions: 'preguntas',
            difficulty: 'Dificultad',
            selectDifficulty: 'Selecciona la dificultad',
            easy: 'Fácil',
            medium: 'Medio',
            hard: 'Difícil',
            cancel: 'Cancelar',
            generate: 'Generar Cuestionario',
            generating: 'Generando...',
            success: 'Cuestionario generado exitosamente',
            error: 'Error al generar el cuestionario',
            pleaseLogin: 'Por favor, inicia sesión para generar el cuestionario',
            questionTypes: {
              multipleChoice: "Opción Múltiple",
              fillInTheBlank: "Completar Espacios",
              trueFalse: "Verdadero/Falso",
              writtenResponse: "Respuesta Escrita",
              multipleChoiceAndFillInTheBlank: "Opción Múltiple & Completar Espacios",
              multipleChoiceAndTrueFalse: "Opción Múltiple & Verdadero/Falso",
              multipleChoiceAndWrittenResponse: "Opción Múltiple & Respuesta Escrita"
            },
            difficultyLevels: {
              low: "Low",
              medium: "Medium",
              high: "High"
            }
          },
          generateWordSearch: {
            generate: 'Generar Sopa de Letras',
            generating: 'Generando...',
            success: 'Sopa de letras generada exitosamente',
            error: 'Error al generar la sopa de letras'
          }
        }
      }
    },
    workshop: {
      title: "Taller",
      subtitle: "Crea y personaliza tus recursos educativos",
      suggestNewTool: "Sugerir una nueva herramienta",
      editAndCustomize: "Edita y personaliza tu contenido",
      exportToPDF: "Exportar a PDF",
      exportToWord: "Exportar a Word",
      shareContent: "Compartir contenido",
      saveChanges: "Guardar cambios",
      workingDocument: "Documento de trabajo",
      wordsToFind: "¡Palabras a encontrar!",
      bold: "Negrita",
      italic: "Cursiva",
      bulletList: "Lista con viñetas",
      numberedList: "Lista numerada",
      undo: "Deshacer",
      categories: {
        all: "Todos",
        favorites: "Favoritos",
        planning: "Planificación",
        assessment: "Evaluación",
        content: "Contenido",
        communication: "Comunicación",
        createTool: "Crear Herramienta"
      },
      tools: {
        dua: {
          title: "Diseño Universal para el Aprendizaje (DUA)",
          description: "Crea diseños universales para el aprendizaje que se adapten a las necesidades de todos los estudiantes"
        },
        quizCreator: {
          title: "Creador de Cuestionarios",
          description: "Genera cuestionarios personalizados con preguntas de opción múltiple, verdadero/falso y respuesta abierta, adaptados al nivel educativo y tema específico. Incluye retroalimentación detallada y análisis de resultados."
        },
        lessonPlanner: {
          title: "Planificador de Lecciones",
          description: "Diseña planes de clase detallados con objetivos de aprendizaje, actividades interactivas, recursos multimedia y evaluación formativa. Optimiza el tiempo de enseñanza y mejora la efectividad del aprendizaje."
        },
        educationalMaterial: {
          title: "Ideas de Materiales Educativos",
          description: "Crea recursos didácticos interactivos como infografías, presentaciones y guías de estudio con contenido curricular actualizado. Adapta los materiales a diferentes estilos de aprendizaje y necesidades educativas."
        },
        ideaGenerator: {
          title: "Generador de Ideas",
          description: "Obtén propuestas innovadoras para actividades de clase, proyectos colaborativos y estrategias de enseñanza basadas en metodologías activas. Fomenta la creatividad y el aprendizaje significativo."
        },
        reasonableAdjustments: {
          title: "Ajustes Razonables (PIAR)",
          description: "Desarrolla adaptaciones curriculares personalizadas para estudiantes con necesidades educativas especiales, incluyendo modificaciones de contenido, metodología y evaluación. Promueve la inclusión educativa."
        },
        slides: {
          title: "Generador de Diapositivas (Beta)",
          description: "Diseña presentaciones educativas interactivas con elementos visuales, animaciones y actividades de participación activa. Optimiza la transmisión de contenidos y mantiene el interés de los estudiantes."
        },
        wordSearch: {
          title: "Sopa de Letras",
          description: "Genera sopas de letras temáticas con vocabulario específico de la asignatura, incluyendo definiciones y pistas contextuales. Refuerza el aprendizaje de conceptos clave de manera lúdica."
        },
        freeAI: {
          title: "IA Libre",
          description: "Utiliza inteligencia artificial para crear contenido educativo personalizado, generar ideas y optimizar materiales didácticos. Adapta las respuestas a tus necesidades específicas."
        },
        realWorldBenefits: {
          title: "Beneficios del Mundo Real",
          description: "Conecta los conceptos académicos con aplicaciones prácticas en la vida cotidiana y el mundo profesional mediante ejemplos concretos. Facilita la comprensión de la relevancia del aprendizaje."
        },
        projectGenerator: {
          title: "Generador de Proyectos",
          description: "Diseña proyectos interdisciplinarios con objetivos claros, cronogramas, recursos necesarios y criterios de evaluación específicos. Promueve el aprendizaje basado en proyectos."
        },
        studentReports: {
          title: "Informes Estudiantiles",
          description: "Elabora informes detallados del progreso académico con análisis de fortalezas, áreas de mejora y recomendaciones personalizadas. Facilita el seguimiento del desarrollo educativo."
        },
        commemorativeDates: {
          title: "Fechas Conmemorativas",
          description: "Planifica actividades educativas para fechas importantes con recursos históricos, culturales y actividades de reflexión. Enriquece el aprendizaje con contexto cultural y social."
        },
        grammarChecker: {
          title: "Corrector Gramatical",
          description: "Revisa y mejora textos académicos con correcciones gramaticales, ortográficas y sugerencias de estilo. Optimiza la calidad de la comunicación escrita en el ámbito educativo."
        },
        topicSummary: {
          title: "Resumen de Tema",
          description: "Crea resúmenes concisos de temas curriculares con conceptos clave, ejemplos relevantes y conexiones con otros temas. Facilita la comprensión y retención de información."
        },
        crossword: {
          title: "Crucigrama",
          description: "Genera crucigramas educativos con definiciones precisas y pistas contextuales para reforzar vocabulario específico. Promueve el aprendizaje activo y la retención de conceptos."
        },
        mindMap: {
          title: "Mapa Mental",
          description: "Crea mapas mentales visuales para organizar ideas y conceptos."
        },
        timeline: {
          title: "Línea de Tiempo",
          description: "Genera líneas de tiempo educativas para visualizar eventos y procesos."
        },
        conceptMap: {
          title: "Mapa Conceptual",
          description: "Crea un mapa conceptual para visualizar las relaciones entre conceptos."
        },
        questionWheel: {
          title: "Ruleta de Preguntas",
          description: "Implementa una ruleta interactiva con preguntas de diferentes niveles de dificultad para evaluar la comprensión de temas. Hace el aprendizaje más dinámico y participativo."
        },
        parentWorkshops: {
          title: "Talleres para Padres",
          description: "Diseña talleres formativos para padres con estrategias de apoyo al aprendizaje y comunicación efectiva con la escuela. Fortalece la relación familia-escuela."
        },
        teacherTraining: {
          title: "Capacitación Docente",
          description: "Desarrolla programas de formación docente con metodologías innovadoras, herramientas digitales y estrategias pedagógicas actualizadas. Mejora la práctica educativa."
        },
        qualityStandards: {
          title: "Estándares de Calidad",
          description: "Establece criterios de calidad educativa con indicadores medibles, objetivos de mejora y herramientas de evaluación continua. Promueve la excelencia educativa."
        },
        activityIdeas: {
          title: "Ideas de Actividades",
          description: "Genera propuestas de actividades lúdicas y didácticas con objetivos específicos, materiales necesarios y adaptaciones por nivel. Enriquece la experiencia de aprendizaje."
        },
        didacticSequence: {
          title: "Secuencia Didáctica",
          description: "Diseña secuencias de aprendizaje progresivas con actividades secuenciadas, recursos multimedia y evaluación continua. Optimiza el proceso de enseñanza-aprendizaje."
        },
        writing: {
          title: "Redacción",
          description: "Crea guías para la escritura académica con estructuras, ejemplos y criterios de evaluación específicos por tipo de texto. Mejora las habilidades de comunicación escrita."
        },
        textQuestions: {
          title: "Preguntas sobre Texto",
          description: "Genera preguntas de comprensión lectora con diferentes niveles de complejidad y enfoque en habilidades específicas. Evalúa y mejora la comprensión lectora."
        },
        recoveryPlan: {
          title: "Plan de Recuperación",
          description: "Desarrolla planes personalizados de recuperación académica con actividades específicas, seguimiento y evaluación de progreso. Apoya el aprendizaje de estudiantes con dificultades."
        },
        questionCorrection: {
          title: "Corrección de Preguntas",
          description: "Evalúa respuestas de estudiantes con retroalimentación detallada, explicaciones de errores y sugerencias de mejora. Optimiza el proceso de evaluación formativa."
        },
        essayGrader: {
          title: "Calificador de Ensayos",
          description: "Evalúa ensayos académicos considerando estructura, argumentación, uso de fuentes y calidad de la escritura. Proporciona retroalimentación constructiva y detallada."
        },
        textLeveling: {
          title: "Nivelación de Textos",
          description: "Adapta textos educativos a diferentes niveles de lectura considerando vocabulario, complejidad sintáctica y contenido. Facilita el acceso a la información según las necesidades."
        },
        textAccessibility: {
          title: "Accesibilidad de Textos",
          description: "Modifica textos para hacerlos accesibles con adaptaciones para diferentes necesidades educativas y estilos de aprendizaje. Promueve la inclusión en el acceso a la información."
        },
        checklist: {
          title: "Lista de Verificación (Cotejo)",
          description: "Genera una lista de verificación para ayudar a los estudiantes a organizar su aprendizaje."
        },
        learningObjectives: {
          title: "Objetivos de Aprendizaje",
          description: "Formula objetivos de aprendizaje específicos, medibles y alcanzables con indicadores de logro claros. Guía el proceso de enseñanza y evaluación."
        },
        schoolEmails: {
          title: "Correos Escolares",
          description: "Redacta comunicaciones institucionales profesionales con información clara, concisa y orientada a la acción. Mejora la comunicación entre la escuela y la comunidad educativa."
        },
        parentEmails: {
          title: "Correos para Padres",
          description: "Crea comunicaciones efectivas con padres de familia sobre el progreso académico y aspectos importantes del desarrollo. Fortalece la relación escuela-familia."
        },
        clearInstructions: {
          title: "Instrucciones Claras",
          description: "Elabora instrucciones paso a paso para actividades y tareas con lenguaje preciso y ejemplos concretos. Facilita la comprensión y ejecución de actividades educativas."
        },
        paperTestCorrection: {
          title: "Corrección de Pruebas en Papel o impresion",
          description: "Evalúa pruebas escritas con criterios estandarizados y retroalimentación constructiva para cada respuesta. Optimiza el proceso de evaluación sumativa."
        },
        videoQuestions: {
          title: "Preguntas de Video",
          description: "Crea preguntas de comprensión para videos educativos con diferentes niveles de análisis y reflexión. Evalúa la comprensión de contenidos audiovisuales."
        },
        steam: {
          title: "Generador de Plan STEAM",
          description: "Crea planes STEAM integrando ciencias, tecnología, ingeniería, artes y matemáticas con enfoque interdisciplinario y resolución de problemas."
        },
        rubric: {
          title: "Generador de Rúbricas",
          description: "Crea rúbricas detalladas para evaluar el trabajo de los estudiantes en cualquier tema o proyecto."
        },
        imageSearch: {
          title: "Buscador de Materiales educativos",
          description: "Busca materiales educativos relevantes para tus lecciones en segundos."
        },
      }
    },
    history: {
      title: "Mi Biblioteca de Enseñanza",
      subtitle: "Explora y gestiona tu colección de recursos educativos creados con inteligencia artificial",
      loading: "Cargando talleres...",
      error: {
        noEmail: "No se encontró el correo electrónico en el almacenamiento local",
        fetchError: "Error al cargar los talleres: {status}",
        loadingError: "Error al cargar los talleres"
      },
      selectCategory: "Selecciona una categoría",
      organizeMaterial: "Organiza y accede a todo tu material educativo",
      educationalResources: "Recursos Educativos",
      resources: "recursos",
      resource: "recurso",
      searchResources: "Buscar recursos...",
      newResource: "Nuevo Recurso",
      viewResource: "Ver Recurso",
      noResourcesFound: "No se encontraron recursos",
      noResourcesInCategory: "No hay recursos en esta categoría",
      createNewResource: "Crear nuevo recurso",
      deleteResource: "Eliminar recurso",
      deleteResources: "Eliminar recursos",
      deleteConfirmation: "¿Estás seguro?",
      deleteConfirmationDescription: "Esta acción eliminará {count} {resource} de forma permanente. Esta acción no se puede deshacer.",
      cancel: "Cancelar",
      delete: "Eliminar",
      createResource: "Crear Recurso",
      sure: "¿Estás seguro?",
      actionCannotBeUndone: "Esta acción no se puede deshacer.",
      tools: {
        "crear-cuestionario": {
          title: "Creador de Cuestionarios",
          description: "Crea un cuestionario en minutos con la ayuda de ProfePlanner. Esta herramienta es excelente para crear evaluaciones formativas."
        },
        "rubrica-evaluacion": {
          title: "Generador de Rúbricas",
          description: "Crea rúbricas de evaluación detalladas para el trabajo y proyectos de tus estudiantes."
        },
        "sopa-de-letras": {
          title: "Sopa de Letras",
          description: "Crea sopas de letras educativas para reforzar el aprendizaje de vocabulario y conceptos clave."
        },
        "crear-plan-de-leccion": {
          title: "Planificador de Lecciones",
          description: "Ahorra tiempo y energía creando un plan de lección detallado con la ayuda de ProfePlanner."
        },
        "crear-material-educativo": {
          title: "Material Educativo",
          description: "Genera material educativo personalizado para tus clases."
        },
        "generar-ideas": {
          title: "Generador de Ideas",
          description: "Genera ideas creativas para tus actividades educativas."
        },
        "ia-libre": {
          title: "IA Libre",
          description: "Utiliza la IA sin restricciones para tus necesidades educativas."
        },
        "beneficios-del-mundo-real": {
          title: "Logros del Mundo Real",
          description: "Explora los beneficios y aplicaciones prácticas de los temas educativos."
        },
        "generar-proyecto": {
          title: "Generador de Proyectos",
          description: "Crea proyectos educativos completos y atractivos."
        },
        "generar-informe-estudiantil": {
          title: "Informes de Estudiantes",
          description: "Crea informes detallados sobre el progreso de los estudiantes."
        },
        "generar-correo-para-padres": {
          title: "Correos para Padres",
          description: "Genera comunicaciones efectivas para los padres."
        },
        "ideas-fechas-conmemorativas": {
          title: "Fechas Conmemorativas",
          description: "Encuentra ideas para celebrar fechas importantes."
        },
        "corrector-gramatical": {
          title: "Corrector Gramatical",
          description: "Corrige y mejora textos educativos."
        },
        "resumen-tema": {
          title: "Resumen de Tema",
          description: "Genera resúmenes concisos de temas educativos."
        },
        "talleres-de-padres": {
          title: "Talleres de Padres",
          description: "Crea talleres educativos para padres."
        },
        "capacitacion-docentes": {
          title: "Capacitación Docentes",
          description: "Genera planes de capacitación para docentes."
        },
        "estandares-calidad-educacion": {
          title: "Estándares de Calidad",
          description: "Define estándares de calidad educativa."
        },
        "generar-ideas-actividades": {
          title: "Ideas de Actividades",
          description: "Genera ideas para actividades educativas."
        },
        "generar-secuencia-didactica": {
          title: "Secuencia Didáctica",
          description: "Crea secuencias didácticas completas."
        },
        "generar-redaccion": {
          title: "Redacción",
          description: "Genera ejercicios de redacción."
        },
        "generar-preguntas-texto": {
          title: "Preguntas sobre Texto",
          description: "Genera preguntas de comprensión lectora."
        },
        "generar-plan-recuperacion": {
          title: "Plan de Recuperación",
          description: "Crea planes de recuperación académica."
        },
        "correccion-preguntas": {
          title: "Corrección de Preguntas",
          description: "Corrige y mejora preguntas de evaluación."
        },
        "calificador-ensayos": {
          title: "Calificador de Ensayos",
          description: "Evalúa y califica ensayos estudiantiles."
        },
        "nivelacion-textos": {
          title: "Nivelación de Textos",
          description: "Adapta textos a diferentes niveles educativos."
        },
        "accesibilidad-textos": {
          title: "Accesibilidad de Textos",
          description: "Hace los textos más accesibles para todos."
        },
        "generar-objetivos-aprendizaje": {
          title: "Objetivos de Aprendizaje",
          description: "Define objetivos de aprendizaje claros."
        },
        "generar-correo-escolar": {
          title: "Correos Escolares",
          description: "Genera comunicaciones escolares efectivas."
        },
        "generar-instrucciones-claras": {
          title: "Instrucciones Claras",
          description: "Crea instrucciones claras para actividades."
        },
        "crear-cuestionario-video-youtube": {
          title: "Preguntas de Video de YouTube",
          description: "Genera preguntas de comprensión y análisis a partir de videos de YouTube para evaluar el aprendizaje de tus estudiantes."
        }
      }
    },
    community: {
      searchPlaceholder: "Búsqueda por temas, materiales, etc.",
      searchResults: "resultados",
      subscribePremium: "¡Comunidad!",
      notifications: "Notificaciones",
      points: "puntos",
      medals: "medallas",
      feed: "Feed",
      readyMaterials: "Materiales listos",
      readyMaterialsTitle: "✨ Materiales listos",
      readyMaterialsDescription: "Descubre y comparte recursos educativos innovadores para tu aula.",
      communitySearch: "Buscar en la comunidad...",
      userProfile: {
        inviteFriends: "Invitar amigos",
        english: "Inglés"
      },
      post: {
        placeholder: "Pregunta o comparte en la comunidad",
        forYou: "Para ti",
        like: "Me gusta",
        comments: "comentarios",
        reply: "Responder a"
      },
      collaborators: {
        title: "Más colaborativos",
        masterAI: "Maestro en IA"
      },
      inicio: {
        title: "✨ Materiales listos",
        subtitle: "Descubre y comparte recursos educativos innovadores para tu aula.",
        discover: "Descubre y comparte",
        materials: "Materiales",
        ideas: "Ideas",
        inspiration: "Inspiración",
        searchPlaceholder: "Buscar recursos compartidos...",
        filterPlaceholder: "Filtrar por tipo",
        allTypes: "Todos los tipos",
        loading: "Cargando recursos compartidos...",
        viewResource: "Ver Recurso",
        email: "Correo electrónico",
        types: {
          "planificador-de-clases": "Planificador de Clases",
          "herramientas-ia": "Herramientas de IA",
          "historial": "Historial",
          "materiales-listos": "Materiales listos",
          "ranking": "Ranking",
          "crear-material-educativo": "Crear Material Educativo",
          "generar-ideas": "Generar Ideas",
          "ajustes-razonables": "Ajustes Razonables (PIAR)",
          "diapositivas-automaticas": "Diapositivas Automáticas",
          "sopa-de-letras": "Sopa de Letras",
          "ia-libre": "IA Libre",
          "beneficios-mundo-real": "Beneficios del Mundo Real",
          "generar-proyecto": "Generar Proyecto",
          "generar-informe-estudiantil": "Generar Informe Estudiantil",
          "ideas-fechas-conmemorativas": "Ideas de Fechas Conmemorativas",
          "corrector-gramatical": "Corrector Gramatical",
          "resumen-tema": "Resumen de Tema",
          "crucigrama": "Crucigrama",
          "mapa-mental-flow": "Mapa Mental",
          "ruleta-preguntas": "Ruleta de Preguntas",
          "talleres-padres": "Talleres para Padres",
          "capacitacion-docente": "Capacitación Docente",
          "estandares-calidad": "Estándares de Calidad",
          "generar-ideas-actividades": "Generar Ideas de Actividades",
          "secuencia-didactica": "Secuencia Didáctica",
          "escritura": "Escritura",
          "preguntas-texto": "Preguntas de Texto",
          "plan-recuperacion": "Plan de Recuperación",
          "correccion-preguntas": "Corrección de Preguntas",
          "calificador-ensayos": "Calificador de Ensayos",
          "nivelacion-textos": "Nivelación de Texto",
          "accesibilidad-textos": "Accesibilidad de Texto",
          "objetivos-aprendizaje": "Objetivos de Aprendizaje",
          "correos-escolares": "Correos Escolares",
          "correos-padres": "Correos para Padres",
          "instrucciones-claras": "Instrucciones Claras",
          "correccion-pruebas-papel": "Corrección de Pruebas en Papel",
          "preguntas-video": "Preguntas de Video",
          "generar-instrucciones": "Generar Instrucciones",
          "crear-plan-de-leccion": "Crear Plan de Lección",
          "generar-plan-recuperacion": "Generar Plan de Recuperación",
          "generar-preguntas-texto": "Generar Preguntas de Texto",
          "crear-cuestionario": "Crear Cuestionario",
          "generar-secuencia-didactica": "Generar Secuencia Didáctica",
          "generar-instrucciones-claras": "Generar Instrucciones Claras",
          "mindMap": {
            title: "Mapa Mental",
            description: "Crea mapas mentales visuales para organizar ideas y conceptos."
          },
          "timeline": {
            title: "Línea de Tiempo",
            description: "Genera líneas de tiempo educativas para visualizar eventos y procesos."
          },
          "conceptMap": {
            title: "Mapa Conceptual",
            description: "Crea un mapa conceptual para visualizar las relaciones entre conceptos."
          },
          "questionWheel": {
            title: "Question Wheel",
            description: "Generate an interactive wheel with questions to make learning more dynamic."
          }
        }
      }
    },
    ranking: {
      title: "Ranking de Profesores",
      subtitle: "Reconocemos tu dedicación y esfuerzo",
      promotion: {
        title: "¡Gana Premios al Finalizar las Clases en Noviembre! 🎉",
        description: "Gana puntos al crear cuestionarios y completar actividades. ¡Mantente activo y sube en el ranking para ganar medallas y premios especiales! 🎁",
        callToAction: "¡Participa y demuestra tu dedicación! 🚀"
      }
    },
    lessonPlanner: {
      title: "Planificador de Lecciones",
      buttons: {
        exportToPDF: "Exportar a PDF",
        exportToWord: "Exportar a Word",
        share: "Compartir"
      },
      editor: {
        paragraph: "Párrafo",
        heading1: "Título 1",
        heading2: "Título 2",
        heading3: "Título 3"
      },
      messages: {
        generating: "Generando plan de lección...",
        typing: "Escribiendo...",
        noLessonPlan: "Aún no hay plan de lección generado",
        completeForm: "Complete el formulario para generar su plan de lección"
      },
      form: {
        title: "Formulario de Plan de Lección",
        help: {
          title: "Ayuda",
          learningObjectives: {
            title: "Objetivos de Aprendizaje",
            tip1: "Sea específico y medible",
            tip2: "Alinee con los estándares curriculares",
            tip3: "Considere diferentes estilos de aprendizaje"
          },
          duration: {
            title: "Duración",
            tip1: "Considere la duración de la clase",
            tip2: "Incluya tiempo para actividades",
            tip3: "Planifique las transiciones"
          }
        },
        fields: {
          name: {
            label: "Nombre de la Lección",
            tooltip: "Ingrese un nombre descriptivo para su lección",
            placeholder: "e.g., Introducción a las Fracciones"
          },
          topic: {
            label: "Tema",
            tooltip: "¿Qué cubrirá esta lección?",
            placeholder: "e.g., Fracciones Básicas"
          },
          grade: {
            label: "Nivel de Grado",
            tooltip: "Seleccione el nivel de grado apropiado",
            placeholder: "Seleccione nivel de grado",
            options: {
              preschool: "Preescolar",
              grade1: "Grado 1",
              grade2: "Grado 2",
              grade3: "Grado 3",
              grade4: "Grado 4",
              grade5: "Grado 5",
              grade6: "Grado 6",
              grade7: "Grado 7",
              grade8: "Grado 8",
              grade9: "Grado 9",
              grade10: "Grado 10",
              grade11: "Grado 11",
              university: "Universidad"
            }
          },
          subject: {
            label: "Asignatura",
            tooltip: "Seleccione el área de asignatura",
            placeholder: "Seleccione asignatura",
            options: {
              biology: "Biología",
              naturalSciences: "Ciencias Naturales",
              socialSciences: "Ciencias Sociales",
              economics: "Economía",
              artEducation: "Educación Artística",
              physicalEducation: "Educación Física",
              physics: "Física",
              geography: "Geografía",
              history: "Historia",
              english: "Inglés",
              mathematics: "Matemáticas",
              chemistry: "Química",
              language: "Lengua",
              literature: "Literatura",
              religion: "Religión",
              politicalConstitution: "Constitución Política",
              ethics: "Ética",
              philosophy: "Filosofía",
              informationTechnology: "Tecnología e Informática",
              environmentalEducation: "Educación Ambiental",
              afroColombianStudies: "Estudios Afrocolombianos",
              citizenshipEducation: "Educación Ciudadana",
              peaceEducation: "Educación para la Paz",
              sexualityEducation: "Educación Sexual",
              other: "Otro"
            },
            customPlaceholder: "Ingrese asignatura personalizada"
          },
          duration: {
            label: "Duración",
            tooltip: "¿Cuánto tiempo durará esta lección?",
            placeholder: "Seleccione duración",
            minutes: "minutos"
          },
          objectives: {
            label: "Objetivos de Aprendizaje",
            tooltip: "¿Qué aprenderán los estudiantes?",
            placeholder: "Ingrese objetivos de aprendizaje"
          },
          methodology: {
            label: "Metodología de Enseñanza",
            tooltip: "Seleccione el enfoque de enseñanza",
            placeholder: "Seleccione metodología",
            options: {
              lecture: "Clase magistral",
              activeLearning: "Aprendizaje activo",
              practicalLearning: "Aprendizaje práctico",
              socialEmotionalLearning: "Aprendizaje social y emocional",
              caseBased: "Aprendizaje Basado en Casos",
              inquiryBased: "Aprendizaje Basado en Indagación",
              researchBased: "Aprendizaje Basado en Investigación",
              problemBased: "Aprendizaje Basado en Problemas",
              projectBased: "Aprendizaje Basado en Proyectos",
              challengeBased: "Aprendizaje Basado en Retos",
              collaborative: "Aprendizaje Colaborativo",
              flipped: "Aprendizaje Invertido",
              designThinking: "Design Thinking",
              gamification: "Gamificación",
              dua: "DUA: Diseño Universal para el Aprendizaje"
            },
            descriptions: {
              lecture: "El profesor presenta el contenido de manera directa, mientras los estudiantes asimilan y toman notas.",
              activeLearning: "Los estudiantes participan activamente, realizando actividades prácticas y proyectos colaborativos.",
              practicalLearning: "Muestra cómo el contenido se aplica a profesiones reales, preparándolos para los desafíos del mercado.",
              socialEmotionalLearning: "Combina contenido escolar con habilidades socioemocionales, como la empatía y el trabajo en equipo.",
              caseBased: "Los estudiantes analizan situaciones reales o simuladas para aplicar conocimientos",
              inquiryBased: "Se fomenta la curiosidad, iniciando desde preguntas del estudiante para investigar",
              researchBased: "Los estudiantes indagan científicamente para resolver preguntas complejas",
              problemBased: "Resolver problemas reales o simulados para desarrollar habilidades de análisis",
              projectBased: "Los estudiantes crean un producto final aplicando conocimientos durante el proceso",
              challengeBased: "Enfrentan desafíos reales que requieren soluciones creativas e innovadoras",
              collaborative: "Fomenta el trabajo en equipo para alcanzar objetivos comunes mediante la cooperación",
              flipped: "El estudiante revisa teoría en casa y aplica en clase mediante prácticas guiadas",
              designThinking: "Metodología centrada en el usuario para diseñar soluciones creativas a problemas complejos",
              gamification: "Aplica elementos del juego para motivar y hacer más atractivo el proceso de aprendizaje",
              dua: "Proporciona múltiples formas de aprender, involucrarse y expresar el conocimiento"
            }
          },
          isPublic: {
            label: "Hacer Público",
            tooltip: "Comparta este plan de lección con otros profesores",
            description: "Hacer este plan de lección visible para otros profesores"
          }
        },
        buttons: {
          generating: "Generando...",
          generate: "Generar Plan de Lección",
          preview: "Vista Previa"
        }
      },
      preview: {
        title: "Vista Previa del Plan de Lección"
      },
      previewButtons: {
        close: "Cerrar"
      }
    }
  },
}; 