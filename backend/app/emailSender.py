from email.message import EmailMessage
from email.mime.base import MIMEBase
from email import encoders
import os
import smtplib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

def send_email(to_email, subject, message, attachment=None):
    try:
        smtp_server = os.getenv("EMAIL_HOST")
        smtp_port = int(os.getenv("EMAIL_PORT"))
        smtp_user = os.getenv("EMAIL_USER")
        smtp_password = os.getenv("EMAIL_PASS")

        # Create the email message
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = to_email

        # Set the email content
        msg.set_content(message)

        # If an attachment is provided, make the message multipart
        if attachment:
            # Change the message to multipart
            msg.add_alternative(message, subtype='plain')  # Add plain text alternative
            with open(attachment, "rb") as att:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(att.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(attachment)}")
                msg.attach(part)

        # Send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()  # Start TLS for security
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        print(f"Sent email to {to_email}")
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
