var app;

(function (app) {
    var Modal = (function () {
        function createContainer(selector) {
            removeContainer(selector);

            return $([
                '<div class="modal inmodal fade" tabindex="-1" role="dialog" aria-hidden="true">',
                    '<div class="modal-dialog">',
                        '<div class="modal-content"></div>',
                    '</div>',
                '</div>'
            ].join('')).attr('id', selector).appendTo('body');
        }

        function removeContainer(selector) {
            var $container = $('#' + selector);

            if ($container.length) {
                $container.remove();
            }
        }

        return function (options) {
            var random = '' + Math.floor((Math.random() * 1000000)) + new Date().getTime();

            options = $.extend({
                factory: null,
                id: 'modal_' + random,
                url: '#',
                scripts: [],
                type: 'modal-sm', // modal-lg
                backdrop: false,
            }, options);

            var $modal = null;
            var args = null;
            var closeCB = [];
            var resultCB = null;
            var loadedScripts = [];

            var api = null;
            var instance = null; // TODO: ???

            var save = function () {
                if (instance && instance.save) {
                    instance.save();
                }
            };

            var init = function () {
                $modal = $('#' + options.id);
                options.backdrop && $modal.modal({ backdrop: 'static' });

                $modal.on('hidden.bs.modal', function () {
                    removeContainer(options.id);

                    for (var i = 0; i < closeCB.length; i += 1) {
                        closeCB[i] && closeCB[i]();
                    }
                });

                $modal.on('shown.bs.modal', function () {
                    $modal.find('input:not([type=hidden]):first').focus();
                });

                var factory = app.modals[options.factory];

                if (factory) {
                    instance = new factory();

                    if (instance.init) {
                        instance.init(api, args);
                    }
                }

                $modal.find('.save-button').click(function () {
                    save();
                });

                $modal.find('.modal-body').keydown(function (evt) {
                    if (evt.which === 13) {
                        evt.preventDefault();
                        save();
                    }
                });

                $modal.modal('show');
            };

            var open = function (data, cb) {
                args = data || {};
                resultCB = cb;
                
                createContainer(options.id)
                    .find('.modal-dialog').addClass(options.type)
                    .find('.modal-content').load(options.url, function (res, status, xhr) {
                        if (status === 'error') {
                            dhp.message.warn(dhp.localization.dhpWeb('InternalServerError'));
                            return;
                        }

                        if (options.scripts.length) {
                            var promises = [];

                            for (var i = 0; i < options.scripts.length; i += 1) {
                                if (_.indexOf(loadedScripts, options.scripts[i]) < 0) {
                                    promises.push($.getScript(options.scripts[i])
                                        .done(function () {
                                            loadedScripts.push(options.scripts[i]);
                                        })
                                        .fail(function () {
                                            dhp.message.warn(dhp.localization.dhpWeb('InternalServerError'));
                                        }));
                                }
                            }

                            $.when.apply($, promises).done(init);
                        }
                        else {
                            init();
                        }
                    });
            };

            var close = function () {
                if (!$modal) {
                    return;
                }

                $modal.modal('hide');
            };

            var onClose = function (cb) {
                closeCB.push(cb);
            };

            var setBusy = function (busy) {
                if (!$modal) {
                    return;
                }

                $modal.find('.modal-footer button').buttonBusy(busy);
            };

            return api = {
                open: open,
                reopen: function () { open(args); },
                close: close,
                onClose: onClose,
                setBusy: setBusy,
                args: function () { return args },
                modal: function () { return $modal },
                modalId: function () { return options.id },
                options: function () { return options },
                result: function () { resultCB && resultCB.apply(this, arguments) }
            };
        };
    })();

    $.extend(app, { Modal: Modal, modals: app.modals || {} });
})(app || (app = {}));
