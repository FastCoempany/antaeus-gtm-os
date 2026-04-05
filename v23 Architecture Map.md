```mermaid
graph TD
    classDef rawData fill:#F6F8FC,stroke:#0A1C40,stroke-width:2px,rx:6px,ry:6px;
    classDef normalization fill:#F3F7FF,stroke:#2471E7,stroke-width:2px,color:#0A1C40,rx:6px,ry:6px;
    classDef gateEngine fill:#FFF6EF,stroke:#E6701E,stroke-width:2px,color:#9F470A,rx:16px,ry:16px;
    classDef riskEngine fill:#FFF6EF,stroke:#E6701E,stroke-width:2px,color:#9F470A,rx:16px,ry:16px;
    classDef output fill:#F1FBF7,stroke:#129266,stroke-width:2px,color:#083F2D,rx:16px,ry:16px;

    subgraph Local_Data [Local Data]
        A1[(localStorage / Workspace)] :::rawData
    end

    subgraph Data_Standardization [Blue Structure]
        B1[adaptDeal Normalizer] :::normalization
        B2[stageAgeDays] :::normalization
        B3[threadingDepth Math] :::normalization
    end

    subgraph Qualification_Engine [Orange Pressure]
        C1{assessGates Filter} :::gateEngine
        C2[missingMap Generator] :::gateEngine
        C3[qualScore: 0-18] :::gateEngine
    end

    subgraph Vitals_Risk_Math [Orange Pressure]
        D1{computeVitals Engine} :::riskEngine
        D2[computeRisk: 0-100 Score] :::riskEngine
        D3[CAUSES Engine Diagnosis] :::riskEngine
    end

    subgraph The_Move_Generator [Orange Pressure]
        E1[topCauses Extractor] :::gateEngine
        E2[MOVE_TEMPLATES] :::gateEngine
        E3{generateMoves} :::gateEngine
    end

    subgraph Deal_Outputs [Green Health]
        F1[Single Deal Narrative] :::output
        F2[Pipeline Coverage Math] :::output
        F3[Monday Review Briefing] :::output
    end

    A1 -->|Raw v31/v32 Deal Data| B1
    
    B1 --> B2
    B1 --> B3
    B1 --> C1

    C1 -->|Present / Weak / Missing| C2
    C1 -->|Calculates Math| C3

    B2 --> D1
    B3 --> D1
    C2 --> D1
    C3 --> D1

    D1 -->|Passes Vitals| D2
    D1 -->|Checks Failure Matrix| D3

    D3 -->|Filters by Severity| E1
    E1 --> E3
    E2 -->|Injects Deal Name| E3

    D1 -->|Object Context| F1
    D1 -->|Aggregates| F2
    E3 -->|Ranks by Urgency| F3
    F2 -->|Feeds Stats| F3

    linkStyle 0,1,2,3 stroke:#2471E7,stroke-width:2px;
    linkStyle 4,5,6,7,8,9,10,11,12,13,14 stroke:#E6701E,stroke-width:2px;
    linkStyle 15,16,17,18 stroke:#129266,stroke-width:3px;
