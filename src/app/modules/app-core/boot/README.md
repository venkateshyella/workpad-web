BootService
-------------

>The purpose of the `BootService` is to bring the app to a ready state, where the app is ready to start running as required.

Here most of the initialization and async operations that maybe required are performed.

For example: 

- Load language files.
- Setup DB.
- Connect to the app server.
- Check device features.
etc..

Some of these steps may fail for some reason. In such a case, if the failure is deemed to be irrecoverable, the boot up process has in-fact failed.
Whereas if the failure can be recovered from, the `BootService` may retry the step silently or ask user for confirmation before retrying.
