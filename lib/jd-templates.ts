export interface JDTemplate {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export const JD_TEMPLATES: JDTemplate[] = [
  {
    id: "ai-engineer",
    title: "AI Engineer",
    icon: "🤖",
    content: `AI Engineer — WeAssist.io (Internal)

Key Responsibilities:
- Design, implement, and optimize automations using n8n, Make.com, and Zapier
- Build reliable integrations across Microsoft 365, Google Workspace, Slack/Teams, WhatsApp, CRMs
- Develop AI-driven workflows such as transcription pipelines, chatbots, meeting assistants
- Leverage APIs like OpenAI, Claude, ElevenLabs
- Fine-tune, prompt, and optimize LLMs for task-specific use cases
- Create and maintain data dashboards and automated reporting pipelines
- Deploy and manage AI models in production with monitoring and performance tuning
- Document workflows, integrations, and automations

Key Qualifications:
- 2+ years workflow automation (n8n, Make.com, Zapier, Power Automate)
- API integration (REST, OAuth 2.0, webhooks, JSON)
- AI/LLM APIs (OpenAI, Claude, ElevenLabs, transcription/voice tools)
- Strong analytical and troubleshooting skills
- Excellent communication skills
- Programming in Python and/or Node.js

Tech Stack: n8n, Make.com, Zapier, OpenAI, Claude, AirTable, HubSpot, Slack, Python, Node.js, GitHub`,
  },
  {
    id: "fullstack-dev",
    title: "Full-Stack Developer",
    icon: "💻",
    content: `Full-Stack Developer

About the Role:
We're looking for a skilled Full-Stack Developer to build and maintain web applications that power our business operations.

Key Responsibilities:
- Develop and maintain responsive web applications using React/Next.js
- Build robust backend APIs with Node.js/Express or Python/FastAPI
- Design and optimize database schemas (PostgreSQL, MongoDB)
- Implement authentication, authorization, and security best practices
- Write clean, testable code with comprehensive test coverage
- Participate in code reviews and contribute to architectural decisions
- Deploy and monitor applications using CI/CD pipelines

Requirements:
- 3+ years experience in full-stack web development
- Proficiency in TypeScript, React, Node.js
- Experience with SQL and NoSQL databases
- Familiarity with cloud platforms (AWS, GCP, or Azure)
- Understanding of RESTful API design and GraphQL
- Experience with Git and agile workflows
- Strong problem-solving and communication skills

Nice to Have:
- Experience with Docker and Kubernetes
- Knowledge of serverless architectures
- Contributions to open-source projects`,
  },
  {
    id: "product-manager",
    title: "Product Manager",
    icon: "📊",
    content: `Product Manager

About the Role:
We're seeking a Product Manager to drive product strategy and execution for our SaaS platform, working closely with engineering, design, and stakeholders.

Key Responsibilities:
- Define product vision, strategy, and roadmap based on market research and user feedback
- Write detailed PRDs and user stories for engineering teams
- Prioritize features using data-driven frameworks (RICE, ICE, MoSCoW)
- Conduct user interviews, surveys, and usability testing
- Analyze product metrics and KPIs to inform decisions
- Coordinate cross-functional teams to deliver features on time
- Present product updates to stakeholders and leadership

Requirements:
- 3+ years in product management for B2B SaaS products
- Strong analytical skills with experience in data tools (Mixpanel, Amplitude, SQL)
- Excellent written and verbal communication
- Experience with agile methodologies and tools (Jira, Linear)
- Ability to translate complex technical concepts for non-technical audiences
- Track record of shipping products that drive measurable business impact

Nice to Have:
- Technical background or CS degree
- Experience with AI/ML products
- Startup experience`,
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    icon: "📈",
    content: `Data Analyst

About the Role:
Join our data team to transform raw data into actionable insights that drive business decisions across the organization.

Key Responsibilities:
- Analyze large datasets to identify trends, patterns, and insights
- Build and maintain interactive dashboards and reports (Tableau, Power BI, Looker)
- Write complex SQL queries to extract and transform data
- Collaborate with stakeholders to understand business requirements
- Design and execute A/B tests and measure results
- Create automated data pipelines for recurring reports
- Present findings to leadership with clear visualizations and recommendations

Requirements:
- 2+ years experience in data analysis or business intelligence
- Advanced SQL skills (CTEs, window functions, optimization)
- Proficiency in visualization tools (Tableau, Power BI, or Looker)
- Experience with Python or R for statistical analysis
- Strong Excel/Google Sheets skills
- Understanding of statistical concepts (hypothesis testing, regression)
- Excellent communication and storytelling skills

Nice to Have:
- Experience with dbt or similar data transformation tools
- Knowledge of cloud data warehouses (BigQuery, Snowflake, Redshift)
- Familiarity with machine learning concepts`,
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    icon: "⚙️",
    content: `DevOps / Site Reliability Engineer

About the Role:
We're looking for a DevOps Engineer to build and maintain our cloud infrastructure, CI/CD pipelines, and ensure high availability of our production systems.

Key Responsibilities:
- Design, build, and manage cloud infrastructure (AWS/GCP/Azure)
- Implement and maintain CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)
- Containerize applications using Docker and orchestrate with Kubernetes
- Set up monitoring, alerting, and observability (Datadog, Prometheus, Grafana)
- Implement infrastructure as code (Terraform, Pulumi, CloudFormation)
- Manage database operations, backups, and disaster recovery
- Optimize system performance, cost, and security
- Respond to incidents and conduct post-mortems

Requirements:
- 3+ years experience in DevOps or SRE roles
- Strong Linux administration skills
- Experience with container orchestration (Kubernetes, ECS)
- Infrastructure as Code (Terraform preferred)
- CI/CD pipeline design and implementation
- Monitoring and observability best practices
- Networking fundamentals (DNS, load balancing, VPCs)
- Scripting (Bash, Python)

Nice to Have:
- AWS/GCP certifications
- Experience with service mesh (Istio, Linkerd)
- Knowledge of security compliance (SOC2, HIPAA)`,
  },
];
