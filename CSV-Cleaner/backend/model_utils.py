from dotenv import load_dotenv
import os

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME")
HF_TOKEN = os.getenv("HF_TOKEN")

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

print (f"loading model : { MODEL_NAME }")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)


def generate_code(ctx: str, inst: str)->str:
    prompt = f"""### Context:\n{ctx}\n\n### Instruction:\n{inst}\n\n### Python Code:\n"""
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(**inputs, max_new_tokens=150, temperature=0.7)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return result.split("### Python Code:")[-1].strip()
