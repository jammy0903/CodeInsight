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

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate="2026-02-01"
      contactEmail={EMAIL}
      otherLink={{ label: 'Terms & Conditions', to: '/terms' }}
      sections={[
        {
          title: '',
          content: (
            <P>
              This privacy policy applies to the CodeInsight app (hereby referred to as "Application") for mobile devices
              that was created by jammyjam (hereby referred to as "Service Provider") as a Commercial service.
              This service is intended for use "AS IS".
            </P>
          ),
        },
        {
          title: 'Information Collection and Use',
          content: (
            <>
              <P>The Application collects information when you download and use it. This information may include:</P>
              <UL>
                <LI>Your device's Internet Protocol address (e.g. IP address)</LI>
                <LI>The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</LI>
                <LI>The time spent on the Application</LI>
                <LI>The operating system you use on your mobile device</LI>
              </UL>
              <P>The Application does not gather precise information about the location of your mobile device.</P>
              <P>
                The Service Provider may use the information you provided to contact you from time to time to provide you
                with important information, required notices and marketing promotions.
              </P>
            </>
          ),
        },
        {
          title: 'Advertising',
          highlight: true,
          content: (
            <P>
              <strong>Important:</strong> The Application displays advertisements provided by Google AdMob.
              This section explains how advertising data is collected and used.
            </P>
          ),
        },
        {
          title: '',
          content: (
            <>
              <P>The Application uses Google AdMob to display advertisements. AdMob may collect and use certain information including:</P>
              <UL>
                <LI><strong>Advertising ID:</strong> A unique, user-resettable ID for advertising</LI>
                <LI><strong>Device Information:</strong> Device type, operating system version, unique device identifiers</LI>
                <LI><strong>IP Address:</strong> Used to estimate general location</LI>
                <LI><strong>Ad Interaction Data:</strong> Information about how you interact with advertisements</LI>
                <LI><strong>App Usage Data:</strong> Information about your use of the Application</LI>
              </UL>
              <P><strong>Opting Out of Personalized Ads:</strong></P>
              <UL>
                <LI><strong>Android:</strong> Settings &rarr; Google &rarr; Ads &rarr; Opt out of Ads Personalization</LI>
                <LI><strong>iOS:</strong> Settings &rarr; Privacy &rarr; Advertising &rarr; Limit Ad Tracking</LI>
              </UL>
            </>
          ),
        },
        {
          title: 'Third Party Access',
          content: (
            <>
              <P>The Application utilizes third-party services that have their own Privacy Policy:</P>
              <UL>
                <LI><a href="https://www.google.com/policies/privacy/" target="_blank" rel="noreferrer">Google Play Services</a></LI>
                <LI><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Google Analytics for Firebase</a></LI>
                <LI><a href="https://firebase.google.com/support/privacy/" target="_blank" rel="noreferrer">Firebase Crashlytics</a></LI>
                <LI><a href="https://support.google.com/admob/answer/6128543" target="_blank" rel="noreferrer">Google AdMob</a></LI>
              </UL>
            </>
          ),
        },
        {
          title: 'Use of Artificial Intelligence',
          content: (
            <P>
              The Application uses AI technologies to enhance user experience and provide certain features.
              All AI processing is performed in accordance with this privacy policy and applicable laws.
            </P>
          ),
        },
        {
          title: 'Opt-Out Rights',
          content: (
            <P>
              You can stop all collection of information by the Application easily by uninstalling it.
            </P>
          ),
        },
        {
          title: 'Data Retention Policy',
          content: (
            <P>
              The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter.
              If you'd like them to delete your data, please contact{' '}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </P>
          ),
        },
        {
          title: 'Children',
          content: (
            <P>
              The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age.
              If you are a parent or guardian and you are aware that your child has provided us with personal information,
              please contact <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </P>
          ),
        },
        {
          title: 'Security',
          content: (
            <P>
              The Service Provider provides physical, electronic, and procedural safeguards to protect information
              the Service Provider processes and maintains.
            </P>
          ),
        },
        {
          title: 'Changes',
          content: (
            <P>
              This Privacy Policy may be updated from time to time. You are advised to consult this Privacy Policy regularly
              for any changes, as continued use is deemed approval of all changes.
            </P>
          ),
        },
        {
          title: 'Your Consent',
          content: (
            <P>
              By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy.
            </P>
          ),
        },
      ]}
    />
  );
}
