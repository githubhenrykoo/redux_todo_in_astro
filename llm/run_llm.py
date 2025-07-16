from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

# Set Hugging Face token for authentication
os.environ["HUGGING_FACE_HUB_TOKEN"] = "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"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    "itdel/Gasing-8B-v0.1",  # Use the non-quantized model
    token=""
)

print("Loading model (this may take some time on CPU)...")
model = AutoModelForCausalLM.from_pretrained(
    "itdel/Gasing-8B-v0.1",  # Use the non-quantized model
    torch_dtype=torch.float16,  # Use float16 to reduce memory usage
    low_cpu_mem_usage=True,    # Enable low CPU memory usage
    token="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"
)

# Test the model with a simple prompt
prompt = "How much 5+5 with GASING method??"
print(f"\nPrompt: {prompt}")

inputs = tokenizer(prompt, return_tensors="pt")

print("Generating response...")
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=50,  # Generate fewer tokens to speed up inference
        do_sample=True,
        temperature=0.7
    )

print("\nResponse:")
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
