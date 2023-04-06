import dotenv from "dotenv";

import prompts from "prompts";
import { CommandModule } from "yargs";

import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models";
import { BufferMemory } from "langchain/memory";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { extrapolateFhirUrlInstructions } from "./prompts/extrapolateFhirUrl";
import { summarizeFhirResponseInstructions } from "./prompts/summarizeFhirResponse";

const CLASS_PARAMS = {
  Patient: ["active", "name", "gender", "_summary"],
  Practitioner: ["active", "name", "gender", "_summary"],
  RiskAssessment: ["risk", "_summary"],
  Appointment: ["status", "start", "end", "participant"],
  CarePlan: ["status", "intent", "title", "period", "activity"],
};
function knowClassesAndParams() {
  return Object.entries(CLASS_PARAMS)
    .map((entry) => {
      const [className, params] = entry;
      return `CLASS: ${className}, PARAM: ${params.join(", ")}`;
    })
    .join("\n");
}

export default <CommandModule>{
  command: "assistant",
  describe: "FHIR AI assistant",
  handler: async (_options) => {
    dotenv.config(); // OpenAI + Medplum config from .env file

    const generalInstructionPrompt =
      SystemMessagePromptTemplate.fromTemplate(`** INSTRUCTIONS **
The following is a problem resolution done by an AI in 2 separate operations, named and labeled as operation "A" & "B".`);

    const instructionPromptA = await extrapolateFhirUrlInstructions(
      "A",
      knowClassesAndParams()
    );
    console.log("instructionPromptA: ", instructionPromptA);

    const instructionPromptB = summarizeFhirResponseInstructions("B");
    console.log("instructionPromptB: ", instructionPromptB);

    const questionPrompt =
      HumanMessagePromptTemplate.fromTemplate("{question}");
    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      generalInstructionPrompt,
      instructionPromptA,
      instructionPromptB,
      new MessagesPlaceholder("history"),
      questionPrompt,
    ]);
    console.log("chatPrompt: ", chatPrompt);

    const chat = new ChatOpenAI({ temperature: 0 });
    console.log("chat: ", chat);

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
    });

    const conversation = new ConversationChain({
      llm: chat,
      prompt: chatPrompt,
      memory,
    });

    for (;;) {
      // loop until exit/quit
      const query = await prompts({
        type: "text",
        name: "question",
        message: "Q", // pass Chatbot message here?
      });

      if (["quit", "exit"].includes(query.question)) {
        console.log("\nbye-bye 👋\n");
        process.exit(0); // exit on exit or quit
      }

      const question = `[A] Q: ${query.question} ||| fhirURL:`;
      const result1 = await conversation.predict({ question });
      console.log("FHIR URL: ", result1);

      // try {
      //   const searchSet = await getFHIR(result1);
      //   console.log("searchSet: ", searchSet);
      //   console.log("searchSet.entry: ", searchSet.entry);
      // } catch (error) {
      //   console.log("error: ", error);
      //   continue;
      // }

      const result2 = await conversation.predict({
        question: `[B] FHIR search set: "${patientJSON}"`,
      });
      console.log("FHIR response summary: ", result2);
    }
  },
};

// TEMP FHIR search set
const patientJSON = `{
  "resourceType" : "Patient",
  "id" : "example",
  "text" : {
    "status" : "generated",
    "div" : "<div xmlns=\"http://www.w3.org/1999/xhtml\"><p style=\"border: 1px #661aff solid; background-color: #e6e6ff; padding: 10px;\"><b>Jim </b> male, DoB: 1974-12-25 ( Medical record number: 12345\u00a0(use:\u00a0USUAL,\u00a0period:\u00a02001-05-06 --&gt; (ongoing)))</p><hr/><table class=\"grid\"><tr><td style=\"background-color: #f3f5da\" title=\"Record is active\">Active:</td><td>true</td><td style=\"background-color: #f3f5da\" title=\"Known status of Patient\">Deceased:</td><td colspan=\"3\">false</td></tr><tr><td style=\"background-color: #f3f5da\" title=\"Alternate names (see the one above)\">Alt Names:</td><td colspan=\"3\"><ul><li>Peter James Chalmers (OFFICIAL)</li><li>Peter James Windsor (MAIDEN)</li></ul></td></tr><tr><td style=\"background-color: #f3f5da\" title=\"Ways to contact the Patient\">Contact Details:</td><td colspan=\"3\"><ul><li>-unknown-(HOME)</li><li>ph: (03) 5555 6473(WORK)</li><li>ph: (03) 3410 5613(MOBILE)</li><li>ph: (03) 5555 8834(OLD)</li><li>534 Erewhon St PeasantVille, Rainbow, Vic  3999(HOME)</li></ul></td></tr><tr><td style=\"background-color: #f3f5da\" title=\"Nominated Contact: Next-of-Kin\">Next-of-Kin:</td><td colspan=\"3\"><ul><li>Bénédicte du Marché  (female)</li><li>534 Erewhon St PleasantVille Vic 3999 (HOME)</li><li><a href=\"tel:+33(237)998327\">+33 (237) 998327</a></li><li>Valid Period: 2012 --&gt; (ongoing)</li></ul></td></tr><tr><td style=\"background-color: #f3f5da\" title=\"Patient Links\">Links:</td><td colspan=\"3\"><ul><li>Managing Organization: <a href=\"organization-example-gastro.html\">Organization/1</a> &quot;Gastroenterology&quot;</li></ul></td></tr></table></div>"
  },
  "identifier" : [{
    "use" : "usual",
    "type" : {
      "coding" : [{
        "system" : "http://terminology.hl7.org/CodeSystem/v2-0203",
        "code" : "MR"
      }]
    },
    "system" : "urn:oid:1.2.36.146.595.217.0.1",
    "value" : "12345",
    "period" : {
      "start" : "2001-05-06"
    },
    "assigner" : {
      "display" : "Acme Healthcare"
    }
  }],
  "active" : true,
  "name" : [{
    "use" : "official",
    "family" : "Chalmers",
    "given" : ["Peter",
    "James"]
  },
  {
    "use" : "usual",
    "given" : ["Jim"]
  },
  {
    "use" : "maiden",
    "family" : "Windsor",
    "given" : ["Peter",
    "James"],
    "period" : {
      "end" : "2002"
    }
  }],
  "telecom" : [{
    "use" : "home"
  },
  {
    "system" : "phone",
    "value" : "(03) 5555 6473",
    "use" : "work",
    "rank" : 1
  },
  {
    "system" : "phone",
    "value" : "(03) 3410 5613",
    "use" : "mobile",
    "rank" : 2
  },
  {
    "system" : "phone",
    "value" : "(03) 5555 8834",
    "use" : "old",
    "period" : {
      "end" : "2014"
    }
  }],
  "gender" : "male",
  "birthDate" : "1974-12-25",
  "_birthDate" : {
    "extension" : [{
      "url" : "http://hl7.org/fhir/StructureDefinition/patient-birthTime",
      "valueDateTime" : "1974-12-25T14:35:45-05:00"
    }]
  },
  "deceasedBoolean" : false,
  "address" : [{
    "use" : "home",
    "type" : "both",
    "text" : "534 Erewhon St PeasantVille, Rainbow, Vic  3999",
    "line" : ["534 Erewhon St"],
    "city" : "PleasantVille",
    "district" : "Rainbow",
    "state" : "Vic",
    "postalCode" : "3999",
    "period" : {
      "start" : "1974-12-25"
    }
  }],
  "contact" : [{
    "relationship" : [{
      "coding" : [{
        "system" : "http://terminology.hl7.org/CodeSystem/v2-0131",
        "code" : "N"
      }]
    }],
    "name" : {
      "family" : "du Marché",
      "_family" : {
        "extension" : [{
          "url" : "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
          "valueString" : "VV"
        }]
      },
      "given" : ["Bénédicte"]
    },
    "telecom" : [{
      "system" : "phone",
      "value" : "+33 (237) 998327"
    }],
    "address" : {
      "use" : "home",
      "type" : "both",
      "line" : ["534 Erewhon St"],
      "city" : "PleasantVille",
      "district" : "Rainbow",
      "state" : "Vic",
      "postalCode" : "3999",
      "period" : {
        "start" : "1974-12-25"
      }
    },
    "gender" : "female",
    "period" : {
      "start" : "2012"
    }
  }],
  "managingOrganization" : {
    "reference" : "Organization/1"
  }
}`;
