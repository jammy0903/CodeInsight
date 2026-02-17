import { LegalPage } from './LegalPage';

const EMAIL = 'l89192164@gmail.com';

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '10px 0', paddingLeft: 22 }}>{children}</ul>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: 6 }}>{children}</li>;
}

export function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      effectiveDate="2026-02-01"
      contactEmail={EMAIL}
      otherLink={{ label: 'Privacy Policy', to: '/privacy' }}
      sections={[
        {
          title: '',
          content: (
            <P>
              These terms and conditions apply to the CodeInsight app (hereby referred to as "Application") for mobile devices
              that was created by jammyjam (hereby referred to as "Service Provider") as a Commercial service.
            </P>
          ),
        },
        {
          title: '',
          content: (
            <P>
              Upon downloading or utilizing the Application, you are automatically agreeing to the following terms.
              It is strongly advised that you thoroughly read and understand these terms prior to using the Application.
            </P>
          ),
        },
        {
          title: '',
          content: (
            <P>
              Unauthorized copying, modification of the Application, any part of the Application, or our trademarks is strictly prohibited.
              Any attempts to extract the source code of the Application, translate the Application into other languages,
              or create derivative versions are not permitted. All trademarks, copyrights, database rights,
              and other intellectual property rights related to the Application remain the property of the Service Provider.
            </P>
          ),
        },
        {
          title: '',
          content: (
            <P>
              The Service Provider is dedicated to ensuring that the Application is as beneficial and efficient as possible.
              As such, they reserve the right to modify the Application or charge for their services at any time and for any reason.
              The Service Provider assures you that any charges for the Application or its services will be clearly communicated to you.
            </P>
          ),
        },
        {
          title: '',
          content: (
            <P>
              The Application stores and processes personal data that you have provided to the Service Provider in order to provide the Service.
              It is your responsibility to maintain the security of your phone and access to the Application.
              The Service Provider strongly advise against jailbreaking or rooting your phone, which involves removing software restrictions
              and limitations imposed by the official operating system of your device. Such actions could expose your phone to malware, viruses,
              malicious programs, compromise your phone's security features, and may result in the Application not functioning correctly or at all.
            </P>
          ),
        },
        {
          title: 'Third-Party Services',
          content: (
            <>
              <P>The Application utilizes third-party services that have their own Terms and Conditions:</P>
              <UL>
                <LI><a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Google Play Services</a></LI>
                <LI><a href="https://www.google.com/analytics/terms/" target="_blank" rel="noreferrer">Google Analytics for Firebase</a></LI>
                <LI><a href="https://firebase.google.com/terms/crashlytics" target="_blank" rel="noreferrer">Firebase Crashlytics</a></LI>
                <LI><a href="https://developers.google.com/admob/terms" target="_blank" rel="noreferrer">Google AdMob</a></LI>
              </UL>
            </>
          ),
        },
        {
          title: 'Advertisements',
          content: (
            <>
              <P>
                The Application displays advertisements provided by Google AdMob. These advertisements help support the development
                and maintenance of the Application. By using the Application, you agree to view these advertisements.
              </P>
              <P>
                The advertisements may be personalized based on your interests. You may opt out of personalized advertising
                through your device settings or by following the instructions provided by Google.
              </P>
            </>
          ),
        },
        {
          title: 'Disclaimer of Responsibility',
          content: (
            <>
              <P>
                The Service Provider does not assume responsibility for certain aspects. Some functions of the Application require
                an active internet connection. The Service Provider cannot be held responsible if the Application does not function
                at full capacity due to lack of access to Wi-Fi or if you have exhausted your data allowance.
              </P>
              <P>
                If you are using the application outside of a Wi-Fi area, your mobile network provider's agreement terms still apply.
                You may incur charges from your mobile provider for data usage, including roaming data charges.
              </P>
              <P>
                It is your responsibility to ensure that your device remains charged. If your device runs out of battery
                and you are unable to access the Service, the Service Provider cannot be held responsible.
              </P>
              <P>
                The Service Provider accepts no liability for any loss, direct or indirect, that you experience as a result
                of relying entirely on this functionality of the application.
              </P>
            </>
          ),
        },
        {
          title: 'Artificial Intelligence',
          content: (
            <P>
              The Application incorporates Artificial Intelligence (AI) technologies to provide certain features or services.
              By using the Application, you acknowledge and agree that AI may be used to process data and deliver functionalities.
              The Service Provider ensures that all AI usage complies with applicable laws and is designed to benefit the user experience.
            </P>
          ),
        },
        {
          title: 'Updates and Termination',
          content: (
            <P>
              The Service Provider may wish to update the application at some point. The Service Provider does not guarantee
              that it will always update the application so that it is relevant to you and/or compatible with your device.
              However, you agree to always accept updates when offered. The Service Provider may also cease providing the application
              and may terminate its use at any time without notice. Upon any termination, (a) the rights and licenses granted
              to you in these terms will end; (b) you must cease using the application, and (if necessary) delete it from your device.
            </P>
          ),
        },
        {
          title: 'Changes to These Terms and Conditions',
          content: (
            <P>
              The Service Provider may periodically update their Terms and Conditions. You are advised to review this page
              regularly for any changes. The Service Provider will notify you of any changes by posting the new Terms and Conditions on this page.
            </P>
          ),
        },
      ]}
    />
  );
}
