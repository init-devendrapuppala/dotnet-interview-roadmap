/* Data only: every item maps to an existing Markdown document. */
const TOPIC_FILES={"csharp":"abstract-classes|abstraction|anonymous-methods|anonymous-types|arrays|async-await|attributes|boxing-and-unboxing|cancellationtoken|classes|collections-overview|composition-vs-inheritance|concurrent-collections|constants-and-readonly|constructors|control-flow|custom-exceptions|data-types|delegates|dictionary|disposable-and-using|dynamic|encapsulation|enums|events|exception-handling|expression-trees|extension-methods|fields|file-io|garbage-collection|generics|hashset|ienumerable|ienumerator|inheritance|interfaces|iqueryable|lambda-expressions|linkedlist|linq|list|local-functions|lock|memorypool|methods|nullable-reference-types|null-handling|objects|operators|parameter-passing|pattern-matching|polymorphism|properties|queue|records|record-structs|reflection|serialization|solid-principles|source-generators|span-and-memory|stack|stack-vs-heap|streams|stringbuilder|strings|structs|system-text-json|task|threading|threadpool|tuples|type-conversion|unsafe-code|valuetask|value-types-vs-reference-types|variables","dotnet":"assemblies|build-process|clr|configuration|dotnet-architecture|il|jit-compiler|metadata|native-aot|nuget|project-sdk|publish-process|runtime-loading","aspnet-core":"api-versioning|authentication|authorization|background-services|caching|configuration|cookies|cors|dependency-injection|exception-handling|file-upload|filters|global-error-handling|grpc|health-checks|hosted-services|jwt|kestrel|logging|middleware|minimal-apis|model-binding|openapi-swagger|options-pattern|problem-details|rate-limiting|request-pipeline|routing|signalr|versioning|web-api|websockets","entity-framework":"bulk-operations|change-tracker|compiled-queries|concurrency|dapper-vs-ef-core|dbcontext|ef-core-overview|entity-configuration|loading-data|migrations|query-performance|relationships|repositories|transactions","sql":"clustered-vs-nonclustered|cte|deadlocks|group-by|indexes|index-fragmentation|isolation-levels|joins|locking|normalization|pagination|performance-tuning|query-execution-plan|stored-procedures|transactions|window-functions","angular":"angular-architecture|change-detection|components|dependency-injection|forms|guards|http-client|interceptors|modules|observables|routing|rxjs|services|signals|state-management","aws":"alb|api-gateway|cloudformation|cloudwatch|ec2|ecs|eks|elasticache|iam|lambda|rds|s3|secrets-manager|sns|sqs|vpc","design-patterns":"adapter|builder|decorator|facade|factory|mediator|observer|repository|singleton|strategy|unit-of-work","system-design":"api-gateway|caching|circuit-breaker|cqrs|distributed-transactions|event-sourcing|kafka|load-balancer|message-queues|microservices|monolith-vs-microservices|rabbitmq|retry-pattern|saga-pattern|scalability","interview":"behavioral-questions|coding-questions|debugging-scenarios|hr-questions|project-discussions|system-design-case-studies"};
const TOPIC_LEVELS={
    csharp:{
        "Basic":"abstract-classes|abstraction|anonymous-methods|anonymous-types|arrays|classes|collections-overview|constants-and-readonly|constructors|control-flow|data-types|delegates|dictionary|encapsulation|enums|events|exception-handling|extension-methods|fields|interfaces|linkedlist|list|methods|objects|operators|parameter-passing|polymorphism|properties|queue|strings|structs|tuples|type-conversion|value-types-vs-reference-types|variables",
        "Intermediate":"async-await|attributes|boxing-and-unboxing|cancellationtoken|composition-vs-inheritance|custom-exceptions|disposable-and-using|dynamic|file-io|generics|hashset|ienumerable|ienumerator|inheritance|iqueryable|lambda-expressions|linq|local-functions|lock|nullable-reference-types|null-handling|pattern-matching|records|record-structs|serialization|solid-principles|stack|stack-vs-heap|streams|stringbuilder|system-text-json|task|threading|threadpool|valuetask",
        "Advanced":"concurrent-collections|expression-trees|garbage-collection|memorypool|reflection|source-generators|span-and-memory|unsafe-code"
    },
    dotnet:{
        "Basic":"assemblies|clr|configuration|dotnet-architecture|nuget|project-sdk",
        "Intermediate":"build-process|il|jit-compiler|metadata|publish-process",
        "Advanced":"native-aot|runtime-loading"
    },
    "aspnet-core":{
        "Basic":"configuration|dependency-injection|exception-handling|logging|middleware|model-binding|options-pattern|request-pipeline|routing|web-api",
        "Intermediate":"api-versioning|authentication|authorization|background-services|caching|cookies|cors|file-upload|filters|health-checks|hosted-services|jwt|minimal-apis|openapi-swagger|problem-details|rate-limiting|versioning",
        "Advanced":"global-error-handling|grpc|kestrel|signalr|websockets"
    },
    "entity-framework":{
        "Basic":"dbcontext|ef-core-overview|entity-configuration|loading-data|migrations|relationships",
        "Intermediate":"change-tracker|concurrency|dapper-vs-ef-core|query-performance|repositories|transactions",
        "Advanced":"bulk-operations|compiled-queries"
    },
    sql:{
        "Basic":"group-by|joins|normalization",
        "Intermediate":"clustered-vs-nonclustered|cte|indexes|pagination|stored-procedures|transactions|window-functions",
        "Advanced":"deadlocks|index-fragmentation|isolation-levels|locking|performance-tuning|query-execution-plan"
    },
    angular:{
        "Basic":"components|dependency-injection|forms|modules|routing|services",
        "Intermediate":"angular-architecture|guards|http-client|interceptors|observables|rxjs|signals",
        "Advanced":"change-detection|state-management"
    },
    aws:{
        "Basic":"cloudwatch|ec2|iam|lambda|rds|s3|sns|sqs|vpc",
        "Intermediate":"alb|api-gateway|cloudformation|ecs|elasticache|secrets-manager",
        "Advanced":"eks"
    },
    "design-patterns":{
        "Basic":"adapter|builder|facade|factory|singleton",
        "Intermediate":"decorator|observer|repository|strategy|unit-of-work",
        "Advanced":"mediator"
    },
    "system-design":{
        "Basic":"caching|load-balancer|microservices|monolith-vs-microservices|scalability",
        "Intermediate":"api-gateway|circuit-breaker|kafka|message-queues|rabbitmq|retry-pattern",
        "Advanced":"cqrs|distributed-transactions|event-sourcing|saga-pattern"
    },
    interview:{
        "Basic":"behavioral-questions|hr-questions|project-discussions",
        "Intermediate":"coding-questions|debugging-scenarios",
        "Advanced":"system-design-case-studies"
    }
};
const META={"csharp":["C#","Language features, runtime behavior, and coding decisions.","⌘","★★★☆☆"],"dotnet":[".NET Runtime","Build, load, publish, and diagnose managed applications.","⚙","★★★★☆"],"aspnet-core":["ASP.NET Core","Build secure, observable web services.","◉","★★★★☆"],"entity-framework":["Entity Framework Core","Model, query, and persist relational data deliberately.","▤","★★★★☆"],"sql":["SQL","Write correct queries and reason about database behavior.","▦","★★★☆☆"],"angular":["Angular","Build structured, reactive client applications.","△","★★★☆☆"],"aws":["AWS","Deploy and operate services on AWS.","☁","★★★★☆"],"design-patterns":["Design Patterns","Use patterns where they clarify tradeoffs.","◇","★★★☆☆"],"system-design":["System Design","Design reliable distributed systems with explicit tradeoffs.","⌘","★★★★★"],"interview":["Interview Practice","Prepare concise, evidence-based interview answers.","✓","★★★☆☆"]};
const acronyms={api:"API",aws:"AWS",clr:"CLR",cte:"CTE",ef:"EF",grpc:"gRPC",iam:"IAM",il:"IL",jit:"JIT",jwt:"JWT",linq:"LINQ",nuget:"NuGet",rxjs:"RxJS",s3:"S3",sns:"SNS",sqs:"SQS",sql:"SQL",vpc:"VPC"};
const titleFromFile=file=>file.split("-").map(p=>acronyms[p]||p[0].toUpperCase()+p.slice(1)).join(" ");
const readingTime=file=>`${Math.max(3,Math.min(15,Math.ceil((file.length*28+350)/200)))} min`;
const ROADMAP=Object.entries(TOPIC_FILES).map(([id,files])=>{
    const [title,description,icon,difficulty]=META[id];
    const levels=TOPIC_LEVELS[id];
    const topicLevels=new Map(Object.entries(levels).flatMap(([level,items])=>items.split("|").map(file=>[file,level])));
    const filenames=files.split("|");
    const unclassified=filenames.filter(file=>!topicLevels.has(file));
    const unknown=[...topicLevels.keys()].filter(file=>!filenames.includes(file));
    if(unclassified.length||unknown.length) throw new Error(`Topic levels for "${id}" do not match its topic list.`);
    return{id,title,description,icon,topics:filenames.map(file=>({title:titleFromFile(file),path:`topics/${id}/${file}.md`,difficulty,level:topicLevels.get(file),readingTime:readingTime(file)}))};
});
