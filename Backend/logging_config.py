"""
Logging Configuration for Medical Assistant API

This module configures logging for the entire application with appropriate
formatters, handlers, and log levels for different environments.
"""

import logging
import logging.config
import os
from datetime import datetime


def setup_logging(log_level: str = "INFO", log_to_file: bool = True):
    """
    Set up logging configuration for the application.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_to_file: Whether to log to file in addition to console
    """
    
    # Create logs directory if it doesn't exist
    if log_to_file:
        os.makedirs("logs", exist_ok=True)
    
    # Define log format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
        datefmt=date_format
    )
    
    simple_formatter = logging.Formatter(
        fmt=log_format,
        datefmt=date_format
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler for all logs
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)
    root_logger.addHandler(console_handler)
    
    if log_to_file:
        # File handler for all logs
        today = datetime.now().strftime("%Y-%m-%d")
        general_handler = logging.FileHandler(f"logs/medical_assistant_{today}.log")
        general_handler.setLevel(logging.DEBUG)
        general_handler.setFormatter(detailed_formatter)
        root_logger.addHandler(general_handler)
        
        # Error file handler for errors only
        error_handler = logging.FileHandler(f"logs/errors_{today}.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(detailed_formatter)
        root_logger.addHandler(error_handler)
    
    # Set specific log levels for different modules
    logging.getLogger("api.routes.Bland.patients").setLevel(logging.INFO)
    logging.getLogger("api.routes.Bland.appointments").setLevel(logging.INFO)
    logging.getLogger("api.routes.Bland.doctors").setLevel(logging.INFO)
    
    # Suppress verbose logs from external libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)
    logging.getLogger("twilio").setLevel(logging.WARNING)
    
    logging.info("Logging configuration setup complete")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Name of the module/logger
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


# Default setup when module is imported
if __name__ != "__main__":
    setup_logging() 