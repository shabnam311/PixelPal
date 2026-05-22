import os
import base64
import logging
from core.logger import log_event

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OllamaHelper")

_ollama_available = None

def check_ollama_status(model_name="llava"):
    """Checks if Ollama is running and has the required model installed."""
    global _ollama_available
    try:
        import ollama
        # Try to list models to verify connection
        models_list = ollama.list()
        
        # Check if the requested model is available
        models = models_list.get("models", [])
        model_names = [m.get("model") for m in models]
        model_names_short = [m.split(":")[0] for m in model_names if m]
        
        if model_name in model_names_short or any(model_name in name for name in model_names):
            _ollama_available = True
            return True, "Ollama and model available"
        else:
            _ollama_available = False
            err_msg = f"Model '{model_name}' not found. Run 'ollama pull {model_name}' to enable AI checks."
            logger.warning(err_msg)
            return False, err_msg
            
    except ImportError:
        _ollama_available = False
        return False, "Python 'ollama' package not installed"
    except Exception as e:
        _ollama_available = False
        return False, f"Ollama not running: {e}"

def query_ollama_vision(image_path, prompt, model_name="llava"):
    """Sends an image and a text prompt to the local Ollama llava model."""
    global _ollama_available
    
    if _ollama_available is False:
        return None  # Skip if already marked unavailable
        
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return None
        
    try:
        import ollama
        
        # Read and encode image to base64 (ollama python client accepts paths directly,
        # but let's double check or use binary)
        with open(image_path, "rb") as image_file:
            img_data = image_file.read()
            
        logger.info(f"Querying Ollama ({model_name}) with prompt: '{prompt}'...")
        response = ollama.generate(
            model=model_name,
            prompt=prompt,
            images=[img_data],
            options={"temperature": 0.0} # We want deterministic yes/no answers
        )
        
        result_text = response.get("response", "").strip().lower()
        logger.info(f"Ollama response: {result_text}")
        return result_text
        
    except Exception as e:
        logger.error(f"Failed to query Ollama vision: {e}")
        # Mark as unavailable for this session to prevent spamming logs
        _ollama_available = False
        log_event("AI_ERROR", f"Ollama query failed: {e}")
        return None
