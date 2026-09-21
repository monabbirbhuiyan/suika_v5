import os
from openai import OpenAI

# Initialize the client using the NVIDIA integration endpoint
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)

def extract_legal_nodes(document_text: str):
    """
    Parses a CanLII case study using the GLM-5.3 model via NVIDIA's API.
    """
    system_prompt = (
        "You are a legal analysis assistant. Extract the core facts, "
        "legal issues, and final ruling from the following case text."
    )
    
    completion = client.chat.completions.create(
        model="z-ai/glm-5.3",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Case Text:\n{document_text}"}
        ],
        temperature=0.2,  # Keeping this low for factual legal extraction
        top_p=1,
        max_tokens=2048,
        stream=False
    )
    
    # Return the text content of the response
    return completion.choices[0].message.content