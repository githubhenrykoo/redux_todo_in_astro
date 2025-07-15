from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Use a publicly available model instead
model_id = "gpt2"  # Using a smaller public model that doesn't require authentication

# Load tokenizer and model
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_id)

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(model_id)

# Prepare prompt
prompt = "How much 5+5 in GASING method?"
print(f"\nPrompt: {prompt}")

inputs = tokenizer(prompt, return_tensors="pt")

# Generate
print("Generating response...")
outputs = model.generate(**inputs, max_new_tokens=50, do_sample=True, temperature=0.7)

print("\nResponse:")
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
