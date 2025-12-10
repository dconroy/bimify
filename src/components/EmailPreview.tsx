interface EmailPreviewProps {
  bimiSvg: string | null;
  companyName?: string;
}

export function EmailPreview({ bimiSvg, companyName = 'Your Company' }: EmailPreviewProps) {
  if (!bimiSvg) {
    return (
      <div className="email-preview-panel">
        <h3>Email Preview</h3>
        <p className="email-preview-placeholder">Convert to see how your BIMI logo appears in email</p>
      </div>
    );
  }

  return (
    <div className="email-preview-panel">
      <h3>Email Preview</h3>
      <p className="email-preview-hint">How your BIMI logo appears in supporting email clients</p>
      
      <div className="email-inbox-mockup">
        <div className="email-list">
          <div className="email-item email-item-unread">
            <div className="email-checkbox">
              <input type="checkbox" />
            </div>
            <div className="email-star">
              <span>☆</span>
            </div>
            <div className="email-avatar">
              <div 
                className="bimi-logo-in-email"
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
            <div className="email-content">
              <div className="email-header-row">
                <span className="email-sender">{companyName}</span>
                <span className="email-subject">Welcome to {companyName}</span>
                <span className="email-time">10:30 AM</span>
              </div>
              <div className="email-preview-text">
                Thank you for joining us! We're excited to have you as part of our community. Here's what you can expect...
              </div>
            </div>
          </div>

          <div className="email-item">
            <div className="email-checkbox">
              <input type="checkbox" />
            </div>
            <div className="email-star">
              <span>☆</span>
            </div>
            <div className="email-avatar">
              <div 
                className="bimi-logo-in-email"
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
            <div className="email-content">
              <div className="email-header-row">
                <span className="email-sender">{companyName}</span>
                <span className="email-subject">Monthly Newsletter - December 2024</span>
                <span className="email-time">Yesterday</span>
              </div>
              <div className="email-preview-text">
                Check out our latest updates, product announcements, and industry insights from this month...
              </div>
            </div>
          </div>

          <div className="email-item">
            <div className="email-checkbox">
              <input type="checkbox" />
            </div>
            <div className="email-star">
              <span>☆</span>
            </div>
            <div className="email-avatar">
              <div 
                className="bimi-logo-in-email"
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
            <div className="email-content">
              <div className="email-header-row">
                <span className="email-sender">{companyName}</span>
                <span className="email-subject">Order #12345 Confirmation</span>
                <span className="email-time">2 days ago</span>
              </div>
              <div className="email-preview-text">
                Your order has been confirmed and is being processed. You'll receive a shipping notification soon...
              </div>
            </div>
          </div>

          <div className="email-item">
            <div className="email-checkbox">
              <input type="checkbox" />
            </div>
            <div className="email-star">
              <span>☆</span>
            </div>
            <div className="email-avatar">
              <div 
                className="bimi-logo-in-email"
                dangerouslySetInnerHTML={{ __html: bimiSvg }}
              />
            </div>
            <div className="email-content">
              <div className="email-header-row">
                <span className="email-sender">{companyName}</span>
                <span className="email-subject">Account Security Alert</span>
                <span className="email-time">3 days ago</span>
              </div>
              <div className="email-preview-text">
                We noticed a new sign-in to your account. If this was you, no action is needed...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

