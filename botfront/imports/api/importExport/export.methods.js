
import { Meteor } from 'meteor/meteor';
import axios from 'axios';

import { check } from 'meteor/check';

import { Endpoints } from '../endpoints/endpoints.collection';
import { Credentials } from '../credentials';
import { Instances } from '../instances/instances.collection';

import { generateErrorText } from './importExport.utils';


if (Meteor.isServer) {
    import { appLogger, addLoggingInterceptors } from '../../../server/logger';

    const trainingAppLogger = appLogger.child({ fileName: 'export.methods.js' });
    
    Meteor.methods({
        'exportProject'(apiHost, projectId, options) {
            check(apiHost, String);
            check(projectId, String);
            check(options, Object);
            const appMethodLogger = trainingAppLogger.child({ userId: Meteor.userId(), methodName: 'exportProject', callingArgs: { apiHost, projectId, options } });

            const params = { ...options };
            params.output = 'json';
            const exportAxios = axios.create();
            addLoggingInterceptors(exportAxios, appMethodLogger);
            const exportRequest = exportAxios.get(
                `${apiHost}/project/${projectId}/export`,
                { params },
            )
                .then(res => ({ data: JSON.stringify(res.data) }))
                .catch(err => (
                    { error: { header: 'Export Failed', text: generateErrorText(err) } }
                ));
            return exportRequest;
        },
        async 'exportRasa'(projectId, language) {
            check(projectId, String);
            check(language, String);
            const instance = await Instances.findOne({ projectId });
            const credentials = await Credentials.findOne({ projectId }, { fields: { credentials: 1 } });
            const endpoints = await Endpoints.findOne({ projectId }, { fields: { endpoints: 1 } });
            const rasaData = await Meteor.callWithPromise('rasa.getTrainingPayload', projectId, instance, language);

            const exportData = {
                config: rasaData.config[language],
                credentials: credentials.credentials,
                domain: rasaData.domain,
                endpoints: endpoints.endpoints,
                nlu: rasaData.nlu[language].data,
                stories: rasaData.stories,
            };
            return exportData;
        },
    });
}
