import { Injectable } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { AppConfigService } from '../app-config';

@Injectable()
export class GoogleService {
  constructor(private appConfig: AppConfigService) {
  }

  // region Google Captcha
  async validateCaptcha({
                           // TO-DO: Replace the token and reCAPTCHA action variables before running the sample.
                           projectID = 'vansh-suthar-barwa',
                           recaptchaKey = '6LdjiR0rAAAAAMtMlbbCfzxVdf-12wA_y3yXFzZW',
                           token = 'action-token',
                           recaptchaAction = 'action-name',
                         }) {

    const configValues = await this.appConfig.getString('project_id');
    // Create the reCAPTCHA client.
    // TODO: Cache the client generation code (recommended) or call client.close() before exiting the method.
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    // Build the assessment request.
    const request = ({
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    });

    const [response] = await client.createAssessment(request);

    // Check if the token is valid.
    if (!response.tokenProperties.valid) {
      console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
      return null;
    }

    // Check if the expected action was executed.
    // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
    if (response.tokenProperties.action === recaptchaAction) {
      // Get the risk score and the reason(s).
      // For more information on interpreting the assessment, see:
      // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
      console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
      response.riskAnalysis.reasons.forEach((reason) => {
        console.log(reason);
      });

      return response.riskAnalysis.score;
    } else {
      console.log('The action attribute in your reCAPTCHA tag does not match the action you are expecting to score');
      return null;
    }
  }

  // endregion
}

