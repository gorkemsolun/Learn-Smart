from diagrams import Cluster, Diagram
from diagrams.aws.ml import Sagemaker
from diagrams.aws.storage import S3
from diagrams.azure.ml import MachineLearningServiceWorkspaces
from diagrams.gcp.ml import AIPlatform
from diagrams.onprem.client import User
from diagrams.onprem.container import Docker
from diagrams.onprem.database import Mysql
from diagrams.onprem.inmemory import Redis
from diagrams.programming.framework import React


# Increase canvas size and adjust node font size to accommodate labels
def create_diagram():
    with Diagram(
        "Edux Architecture",
        filename="edux_architecture",
        show=False,
        direction="TB",  # Top-to-Bottom layout
        node_attr={"fontsize": "10"},
    ):

        # end user
        user = User("Student / Instructor")

        # frontend
        frontend = React("Next.js Frontend")

        # microservices cluster
        with Cluster("Microservices"):
            auth_svc = Docker("Auth Service")
            user_svc = Docker("User Service")
            course_svc = Docker("Course Service")
            subscription_svc = Docker("Subscription Service")
            skill_svc = Docker("SkillTree Service")
            chat_svc = Docker("Chat Service")
            filemgr_svc = Docker("FileManager Service")
            genai_svc = Docker("GenAI Service")
            notify_svc = Docker("Notification Service")

        # databases cluster
        with Cluster("Databases"):
            auth_db = Mysql("Auth DB")
            user_db = Mysql("User DB")
            course_db = Mysql("Course DB")
            sub_db = Mysql("Subscription DB")
            skill_db = Mysql("SkillTree DB")
            chat_db = Mysql("Chat DB")
            filemgr_db = Mysql("FileManager DB")
            genai_db = Mysql("GenAI DB")
            notify_db = Mysql("Notification DB")

        # shared cache
        cache = Redis("Redis Cache")

        # LLM providers
        with Cluster("LLM Providers"):
            aiplatform = AIPlatform("Gemini")
            sagemaker = AIPlatform("ChatGPT")
            azure_ml = AIPlatform("Claude")

        # AWS resources
        with Cluster("AWS"):
            s3 = S3("S3 Bucket")

        # wiring: user → frontend → all services
        (
            user
            >> frontend
            >> [
                auth_svc,
                user_svc,
                course_svc,
                subscription_svc,
                skill_svc,
                chat_svc,
                filemgr_svc,
                genai_svc,
                notify_svc,
            ]
        )

        # service-to-database edges
        auth_svc >> auth_db
        user_svc >> user_db
        course_svc >> course_db
        subscription_svc >> sub_db
        skill_svc >> skill_db
        chat_svc >> chat_db
        filemgr_svc >> filemgr_db
        genai_svc >> genai_db
        notify_svc >> notify_db

        # services optionally use the shared cache
        for svc in [
            auth_svc,
            user_svc,
            course_svc,
            subscription_svc,
            skill_svc,
            chat_svc,
            filemgr_svc,
            genai_svc,
            notify_svc,
        ]:
            svc >> cache

        # connect GenAI service to LLM providers
        genai_svc >> [aiplatform, sagemaker, azure_ml]

        # FileManager uses AWS S3 for storage
        filemgr_svc >> s3


if __name__ == "__main__":
    create_diagram()
